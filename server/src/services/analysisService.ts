import { db } from "../db";
import { pokemonAnalyses, analysisSets, analysisRevisions, analysisProposals, proposalVotes, users } from "../db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { AppError } from "../errors";
import type { setSchema, proposalSchema, analysisPageSchema } from "../schemas/analysis";
import type { z } from "zod";

type SetData = z.infer<typeof setSchema>;
type ProposalData = z.infer<typeof proposalSchema>;
type PageData = z.infer<typeof analysisPageSchema>;

async function getOrCreateAnalysis(pokemonId: number, userId: number | null) {
  const [existing] = await db.select().from(pokemonAnalyses).where(eq(pokemonAnalyses.pokemonId, pokemonId));
  if (existing) return existing;

  // Two requests can both miss the select above for the same brand-new
  // pokemonId; onConflictDoNothing makes the loser's insert a no-op instead
  // of a thrown 23505, and the re-select below fetches what the winner created.
  const [created] = await db.insert(pokemonAnalyses)
    .values({ pokemonId, createdBy: userId ?? undefined })
    .onConflictDoNothing({ target: pokemonAnalyses.pokemonId })
    .returning();
  if (created) return created;

  const [raceWinner] = await db.select().from(pokemonAnalyses).where(eq(pokemonAnalyses.pokemonId, pokemonId));
  return raceWinner;
}

/* Contributors are derived live from analysis_revisions, not stored — same
 * "computed, not stored" convention as teams' likes_count. Creator = author of
 * the analysis's very first revision, but only if that revision is human
 * (an AI-seeded page has no Creator, only an AI draft contributor). */
async function getContributors(analysisId: number) {
  const revisions = await db
    .select({ authorId: analysisRevisions.authorId, isAi: analysisRevisions.isAi, createdAt: analysisRevisions.createdAt })
    .from(analysisRevisions)
    .where(eq(analysisRevisions.analysisId, analysisId))
    .orderBy(asc(analysisRevisions.createdAt));

  if (revisions.length === 0) return [];

  const first = revisions[0];
  const creatorAuthorId = !first.isAi ? first.authorId : undefined;

  type GroupKey = string;
  const groups = new Map<GroupKey, { authorId: number | null; isAi: boolean; edits: number }>();
  for (const r of revisions) {
    const key = r.isAi ? "ai" : `human:${r.authorId ?? "deleted"}`;
    const g = groups.get(key) ?? { authorId: r.authorId, isAi: r.isAi, edits: 0 };
    g.edits++;
    groups.set(key, g);
  }

  const humanAuthorIds = [...groups.values()].filter((g) => !g.isAi && g.authorId != null).map((g) => g.authorId!);
  const userRows = humanAuthorIds.length
    ? await db.select({ id: users.id, username: users.username }).from(users).where(sql`${users.id} IN ${humanAuthorIds}`)
    : [];
  const usernameById = new Map(userRows.map((u) => [u.id, u.username]));

  const contributors = [...groups.values()].map((g) => ({
    name: g.isAi ? "Claude" : g.authorId != null ? usernameById.get(g.authorId) ?? "Deleted user" : "Deleted user",
    edits: g.edits,
    role: g.isAi ? "AI draft" : g.authorId === creatorAuthorId ? "Creator" : "Editor",
    ai: g.isAi,
  }));

  const rolePriority: Record<string, number> = { Creator: 0, Editor: 1, "AI draft": 2 };
  contributors.sort((a, b) => rolePriority[a.role] - rolePriority[b.role] || b.edits - a.edits);
  return contributors;
}

async function getRevisions(analysisId: number, limit = 20) {
  const rows = await db
    .select({
      id: analysisRevisions.id,
      setId: analysisRevisions.setId,
      setName: analysisSets.name,
      authorId: analysisRevisions.authorId,
      username: users.username,
      isAi: analysisRevisions.isAi,
      status: analysisRevisions.status,
      summary: analysisRevisions.summary,
      createdAt: analysisRevisions.createdAt,
    })
    .from(analysisRevisions)
    .leftJoin(users, eq(analysisRevisions.authorId, users.id))
    .leftJoin(analysisSets, eq(analysisRevisions.setId, analysisSets.id))
    .where(eq(analysisRevisions.analysisId, analysisId))
    .orderBy(desc(analysisRevisions.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    author: r.isAi ? "Claude" : r.username ?? "Deleted user",
  }));
}

async function getProposals(analysisId: number, requestingUserId?: number) {
  const votesCount = sql<number>`(SELECT COUNT(*) FROM proposal_votes WHERE proposal_votes.proposal_id = ${analysisProposals.id})`.as("votes");
  const hasVoted = requestingUserId
    ? sql<boolean>`EXISTS (SELECT 1 FROM proposal_votes WHERE proposal_votes.proposal_id = ${analysisProposals.id} AND proposal_votes.user_id = ${requestingUserId})`.as("hasVoted")
    : sql<boolean>`false`.as("hasVoted");

  const rows = await db
    .select({
      id: analysisProposals.id,
      authorId: analysisProposals.authorId,
      username: users.username,
      targetName: analysisProposals.targetName,
      note: analysisProposals.note,
      itemId: analysisProposals.itemId,
      abilityId: analysisProposals.abilityId,
      natureId: analysisProposals.natureId,
      evs: analysisProposals.evs,
      moves: analysisProposals.moves,
      analysis: analysisProposals.analysis,
      evNote: analysisProposals.evNote,
      teambuilding: analysisProposals.teambuilding,
      matchupNote: analysisProposals.matchupNote,
      status: analysisProposals.status,
      createdAt: analysisProposals.createdAt,
      votes: votesCount,
      hasVoted,
    })
    .from(analysisProposals)
    .leftJoin(users, eq(analysisProposals.authorId, users.id))
    .where(and(eq(analysisProposals.analysisId, analysisId), eq(analysisProposals.status, "pending")))
    .orderBy(desc(votesCount));

  return rows.map((r) => ({ ...r, author: r.username ?? "Deleted user" }));
}

export async function getAnalysis(pokemonId: number, requestingUserId?: number) {
  const [analysis] = await db.select().from(pokemonAnalyses).where(eq(pokemonAnalyses.pokemonId, pokemonId));
  if (!analysis) return null;

  const setRows = await db
    .select({
      id: analysisSets.id,
      name: analysisSets.name,
      role: analysisSets.role,
      itemId: analysisSets.itemId,
      abilityId: analysisSets.abilityId,
      natureId: analysisSets.natureId,
      evs: analysisSets.evs,
      moves: analysisSets.moves,
      analysis: analysisSets.analysis,
      evNote: analysisSets.evNote,
      teambuilding: analysisSets.teambuilding,
      matchupNote: analysisSets.matchupNote,
      handles: analysisSets.handles,
      threats: analysisSets.threats,
      isAiDraft: analysisSets.isAiDraft,
      updatedAt: analysisSets.updatedAt,
      updatedByUsername: users.username,
    })
    .from(analysisSets)
    .leftJoin(users, eq(analysisSets.updatedBy, users.id))
    .where(eq(analysisSets.analysisId, analysis.id))
    .orderBy(asc(analysisSets.orderIndex));

  const sets = setRows.map((s) => ({
    ...s,
    lastEditedBy: s.updatedByUsername ?? "Deleted user",
  }));

  const [contributors, revisions, proposals] = await Promise.all([
    getContributors(analysis.id),
    getRevisions(analysis.id),
    getProposals(analysis.id, requestingUserId),
  ]);

  return { ...analysis, sets, community: { contributors, revisions, proposals } };
}

export async function upsertAnalysisPage(pokemonId: number, data: PageData, userId: number) {
  const analysis = await getOrCreateAnalysis(pokemonId, userId);

  await db.update(pokemonAnalyses).set({
    role: data.role ?? analysis.role,
    overview: data.overview ?? analysis.overview,
  }).where(eq(pokemonAnalyses.id, analysis.id));

  await db.insert(analysisRevisions).values({
    analysisId: analysis.id,
    authorId: userId,
    isAi: false,
    status: "merged",
    summary: "Updated the overview",
  });

  return { id: analysis.id };
}

export async function createSet(pokemonId: number, data: SetData, userId: number) {
  const analysis = await getOrCreateAnalysis(pokemonId, userId);

  // Wrapped in a transaction so the maxOrder read and the insert that depends
  // on it are at least consistent within one connection; the (analysisId,
  // orderIndex) unique constraint (schema.ts) is the actual safety net against
  // two concurrent "add a set" requests landing on the same position — that
  // race is rare enough here that surfacing a clear 409 to retry is an
  // acceptable trade-off against a full retry-loop.
  try {
    return await db.transaction(async (tx) => {
      const [{ maxOrder }] = await tx
        .select({ maxOrder: sql<number>`COALESCE(MAX(${analysisSets.orderIndex}), -1)` })
        .from(analysisSets)
        .where(eq(analysisSets.analysisId, analysis.id));

      const [newSet] = await tx.insert(analysisSets).values({
        analysisId: analysis.id,
        name: data.name,
        role: data.role,
        itemId: data.itemId,
        abilityId: data.abilityId,
        natureId: data.natureId,
        evs: data.evs,
        moves: data.moves,
        analysis: data.analysis,
        evNote: data.evNote,
        teambuilding: data.teambuilding,
        matchupNote: data.matchupNote,
        handles: data.handles ?? [],
        threats: data.threats ?? [],
        orderIndex: maxOrder + 1,
        createdBy: userId,
        updatedBy: userId,
      }).returning();

      await tx.insert(analysisRevisions).values({
        analysisId: analysis.id,
        setId: newSet.id,
        authorId: userId,
        isAi: false,
        status: "merged",
        summary: `Added the "${data.name}" set`,
      });

      return newSet;
    });
  } catch (error: any) {
    if ((error?.cause?.code ?? error?.code) === "23505") {
      throw new AppError(409, "Another set was just added — try again");
    }
    throw error;
  }
}

export async function updateSet(setId: number, data: SetData, userId: number) {
  const [set] = await db.select().from(analysisSets).where(eq(analysisSets.id, setId));
  if (!set) throw new AppError(404, "Set not found");

  await db.update(analysisSets).set({
    name: data.name,
    role: data.role,
    itemId: data.itemId,
    abilityId: data.abilityId,
    natureId: data.natureId,
    evs: data.evs,
    moves: data.moves,
    analysis: data.analysis,
    evNote: data.evNote,
    teambuilding: data.teambuilding,
    matchupNote: data.matchupNote,
    handles: data.handles ?? [],
    threats: data.threats ?? [],
    isAiDraft: false, // a human editing an AI draft is exactly the review step — it's no longer just an AI baseline
    updatedBy: userId,
    updatedAt: new Date(),
  }).where(eq(analysisSets.id, setId));

  await db.insert(analysisRevisions).values({
    analysisId: set.analysisId,
    setId: set.id,
    authorId: userId,
    isAi: false,
    status: "merged",
    summary: `Edited the "${data.name}" set`,
  });

  return { id: setId };
}

export async function createProposal(pokemonId: number, data: ProposalData, userId: number) {
  const analysis = await getOrCreateAnalysis(pokemonId, userId);

  const [proposal] = await db.insert(analysisProposals).values({
    analysisId: analysis.id,
    authorId: userId,
    targetName: data.targetName,
    note: data.note,
    itemId: data.itemId,
    abilityId: data.abilityId,
    natureId: data.natureId,
    evs: data.evs,
    moves: data.moves,
    analysis: data.analysis,
    evNote: data.evNote,
    teambuilding: data.teambuilding,
    matchupNote: data.matchupNote,
  }).returning();

  return proposal;
}

export async function voteProposal(proposalId: number, userId: number) {
  const [proposal] = await db.select().from(analysisProposals).where(eq(analysisProposals.id, proposalId));
  if (!proposal) throw new AppError(404, "Proposal not found");
  if (proposal.status !== "pending") throw new AppError(409, "Proposal already resolved");
  try {
    await db.insert(proposalVotes).values({ proposal_id: proposalId, user_id: userId });
  } catch (error: any) {
    if ((error?.cause?.code ?? error?.code) === "23505") throw new AppError(409, "Already voted");
    throw error;
  }
}

export async function unvoteProposal(proposalId: number, userId: number) {
  await db.delete(proposalVotes).where(
    and(eq(proposalVotes.proposal_id, proposalId), eq(proposalVotes.user_id, userId))
  );
}

// Looks up why a proposal isn't claimable, only called after a conditional
// update already found nothing to update — keeps the 404-vs-409 distinction
// without a second round trip on the (much more common) success path.
async function explainUnclaimable(proposalId: number): Promise<never> {
  const [existing] = await db.select({ id: analysisProposals.id }).from(analysisProposals).where(eq(analysisProposals.id, proposalId));
  if (!existing) throw new AppError(404, "Proposal not found");
  throw new AppError(409, "Proposal already resolved");
}

export async function acceptProposal(proposalId: number, moderatorId: number) {
  return db.transaction(async (tx) => {
    // The status flip is the actual claim — WHERE status='pending' makes it
    // atomic, so only one of two concurrent accept/reject calls can win it.
    const [proposal] = await tx.update(analysisProposals)
      .set({ status: "accepted" })
      .where(and(eq(analysisProposals.id, proposalId), eq(analysisProposals.status, "pending")))
      .returning();
    if (!proposal) await explainUnclaimable(proposalId);

    const moves = proposal.moves;
    if (!moves || moves.length === 0) throw new AppError(400, "Proposal has no moves — can't promote to a set");

    const [{ maxOrder }] = await tx
      .select({ maxOrder: sql<number>`COALESCE(MAX(${analysisSets.orderIndex}), -1)` })
      .from(analysisSets)
      .where(eq(analysisSets.analysisId, proposal.analysisId));

    const authorId = proposal.authorId ?? moderatorId;
    const [newSet] = await tx.insert(analysisSets).values({
      analysisId: proposal.analysisId,
      name: proposal.targetName,
      itemId: proposal.itemId,
      abilityId: proposal.abilityId,
      natureId: proposal.natureId,
      evs: proposal.evs,
      moves,
      analysis: proposal.analysis,
      evNote: proposal.evNote,
      teambuilding: proposal.teambuilding,
      matchupNote: proposal.matchupNote,
      orderIndex: maxOrder + 1,
      createdBy: authorId,
      updatedBy: authorId,
    }).returning();

    await tx.insert(analysisRevisions).values({
      analysisId: proposal.analysisId,
      setId: newSet.id,
      authorId,
      isAi: false,
      status: "merged",
      summary: `Promoted the proposed "${proposal.targetName}" set`,
    });

    return newSet;
  });
}

export async function rejectProposal(proposalId: number) {
  const [proposal] = await db.update(analysisProposals)
    .set({ status: "rejected" })
    .where(and(eq(analysisProposals.id, proposalId), eq(analysisProposals.status, "pending")))
    .returning();
  if (!proposal) await explainUnclaimable(proposalId);
}
