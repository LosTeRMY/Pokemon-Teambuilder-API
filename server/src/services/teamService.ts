import { db } from "../db";
import { teams, teams_pokemons, teams_pokemons_moves, team_likes, users } from "../db/schema";
import { eq, and, ilike, sql, desc, asc, inArray } from "drizzle-orm";
import { createTeamSchema } from "../schemas/team";
import { validateTeam } from "./teamValidation";
import { AppError } from "../errors";
import z from "zod";

type TeamData = z.infer<typeof createTeamSchema>;

export async function listTeams(query: Record<string, unknown>, requestingUserId?: number) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const formatFilter = query.format ? Number(query.format) : null;
  const nameFilter = query.name as string | undefined;
  const userFilter = query.user ? Number(query.user) : null;
  const sort = (query.sort as string) || "newest";

  const toIntArray = (val: unknown): number[] =>
    (Array.isArray(val) ? val : val ? [val] : [])
      .map(Number)
      .filter(n => Number.isInteger(n) && n > 0);

  const pokemonFilters = toIntArray(query.pokemon);
  const moveFilters = toIntArray(query.move);
  const abilityFilters = toIntArray(query.ability);
  const itemFilters = toIntArray(query.item);

  const parsePokemonPairs = (val: unknown) =>
    (Array.isArray(val) ? val : val ? [val] : [])
      .flatMap((raw: unknown) => {
        const [p, v] = String(raw).split(":").map(Number);
        return Number.isInteger(p) && p > 0 && Number.isInteger(v) && v > 0 ? [{ pokemonId: p, valueId: v }] : [];
      });

  const pokemonItemFilters = parsePokemonPairs(query.pokemon_item);
  const pokemonMoveFilters = parsePokemonPairs(query.pokemon_move);
  const pokemonAbilityFilters = parsePokemonPairs(query.pokemon_ability);
  const pokemonNatureFilters = parsePokemonPairs(query.pokemon_nature);

  let likedByUserId: number | null = null;
  if (query.liked_by === "me") {
    if (!requestingUserId) throw new AppError(401, "Unauthorized");
    likedByUserId = requestingUserId;
  } else if (query.liked_by) {
    likedByUserId = Number(query.liked_by) || null;
  }

  const conditions = [];
  if (formatFilter) conditions.push(eq(teams.format_id, formatFilter));
  if (nameFilter) conditions.push(ilike(teams.name, `%${nameFilter}%`));
  if (userFilter) conditions.push(eq(teams.userId, userFilter));
  for (const pokemonId of pokemonFilters) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons WHERE teams_pokemons.team_id = ${teams.id} AND teams_pokemons.pokemon_id = ${pokemonId})`
  );
  for (const abilityId of abilityFilters) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons WHERE teams_pokemons.team_id = ${teams.id} AND teams_pokemons.ability_id = ${abilityId})`
  );
  for (const itemId of itemFilters) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons WHERE teams_pokemons.team_id = ${teams.id} AND teams_pokemons.item_id = ${itemId})`
  );
  for (const moveId of moveFilters) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons tp JOIN teams_pokemons_moves tpm ON tpm.teams_pokemon_id = tp.id WHERE tp.team_id = ${teams.id} AND tpm.move_id = ${moveId})`
  );
  if (likedByUserId !== null) conditions.push(
    sql`EXISTS (SELECT 1 FROM team_likes WHERE team_likes.team_id = ${teams.id} AND team_likes.user_id = ${likedByUserId})`
  );
  for (const { pokemonId, valueId } of pokemonItemFilters) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons WHERE teams_pokemons.team_id = ${teams.id} AND teams_pokemons.pokemon_id = ${pokemonId} AND teams_pokemons.item_id = ${valueId})`
  );
  for (const { pokemonId, valueId } of pokemonMoveFilters) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons tp JOIN teams_pokemons_moves tpm ON tpm.teams_pokemon_id = tp.id WHERE tp.team_id = ${teams.id} AND tp.pokemon_id = ${pokemonId} AND tpm.move_id = ${valueId})`
  );
  for (const { pokemonId, valueId } of pokemonAbilityFilters) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons WHERE teams_pokemons.team_id = ${teams.id} AND teams_pokemons.pokemon_id = ${pokemonId} AND teams_pokemons.ability_id = ${valueId})`
  );
  for (const { pokemonId, valueId } of pokemonNatureFilters) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons WHERE teams_pokemons.team_id = ${teams.id} AND teams_pokemons.pokemon_id = ${pokemonId} AND teams_pokemons.nature_id = ${valueId})`
  );

  const likesCount = sql<number>`(SELECT COUNT(*) FROM team_likes WHERE team_likes.team_id = ${teams.id})`.as('likes_count');
  const liked = requestingUserId
    ? sql<boolean>`EXISTS (SELECT 1 FROM team_likes WHERE team_likes.team_id = ${teams.id} AND team_likes.user_id = ${requestingUserId})`.as('liked')
    : sql<null>`NULL`.as('liked');

  const orderBy = sort === "oldest"
    ? asc(teams.createdAt)
    : sort === "popular"
      ? desc(sql`(SELECT COUNT(*) FROM team_likes WHERE team_likes.team_id = ${teams.id})`)
      : desc(teams.createdAt);

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      userId: teams.userId,
      username: users.username,
      format_id: teams.format_id,
      createdAt: teams.createdAt,
      likes_count: likesCount,
      liked,
    })
    .from(teams)
    .leftJoin(users, eq(teams.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  if (rows.length === 0) return rows.map((t) => ({ ...t, pokemons: [] }));

  const teamIds = rows.map((t) => t.id);
  const pokemonRows = await db.select().from(teams_pokemons).where(inArray(teams_pokemons.team_id, teamIds));
  const pokemonIds = pokemonRows.map((p) => p.id);
  const moveRows = pokemonIds.length > 0
    ? await db.select().from(teams_pokemons_moves).where(inArray(teams_pokemons_moves.teams_pokemon_id, pokemonIds))
    : [];

  const movesByPokemonId = new Map<number, number[]>();
  for (const m of moveRows) {
    const list = movesByPokemonId.get(m.teams_pokemon_id) ?? [];
    list.push(m.move_id);
    movesByPokemonId.set(m.teams_pokemon_id, list);
  }

  const pokemonsByTeamId = new Map<number, ReturnType<typeof summarizePokemon>[]>();
  function summarizePokemon(p: typeof pokemonRows[number]) {
    return {
      pokemon_id: p.pokemon_id,
      ability_id: p.ability_id,
      item_id: p.item_id,
      nature_id: p.nature_id,
      moves: movesByPokemonId.get(p.id) ?? [],
    };
  }
  for (const p of pokemonRows) {
    const list = pokemonsByTeamId.get(p.team_id) ?? [];
    list.push(summarizePokemon(p));
    pokemonsByTeamId.set(p.team_id, list);
  }

  return rows.map((t) => ({ ...t, pokemons: pokemonsByTeamId.get(t.id) ?? [] }));
}

export async function getFormatCounts(): Promise<Record<number, number>> {
  const rows = await db
    .select({ format_id: teams.format_id, count: sql<number>`COUNT(*)` })
    .from(teams)
    .groupBy(teams.format_id);

  const counts: Record<number, number> = {};
  for (const r of rows) counts[r.format_id] = Number(r.count);
  return counts;
}

export async function getTeam(teamId: number) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new AppError(404, "Team not found");

  const pokemonRows = await db.select().from(teams_pokemons).where(eq(teams_pokemons.team_id, teamId));
  const pokemons = await Promise.all(
    pokemonRows.map(async (p) => {
      const moveRows = await db.select().from(teams_pokemons_moves).where(eq(teams_pokemons_moves.teams_pokemon_id, p.id));
      const { notes, roles, ...rest } = p;
      return { ...rest, moves: moveRows.map((m) => m.move_id), notes: { roles: roles ?? [], text: notes ?? "" } };
    })
  );

  return { ...team, pokemons };
}

export async function createTeam(data: TeamData, userId: number) {
  const validation = validateTeam(data);
  if (!validation.valid) throw new AppError(400, validation.error);

  return db.transaction(async (tx) => {
    const [newTeam] = await tx.insert(teams).values({
      name: data.name,
      description: data.description,
      userId,
      format_id: data.formatId,
    }).returning();

    for (const pokemon of data.pokemons) {
      const [newTeamPokemon] = await tx.insert(teams_pokemons).values({
        team_id: newTeam.id,
        pokemon_id: pokemon.pokemonId,
        ability_id: pokemon.abilityId,
        nature_id: pokemon.natureId,
        item_id: pokemon.itemId,
        level: validation.level,
        gender: pokemon.gender,
        shiny: pokemon.shiny,
        happiness: pokemon.happiness,
        nickname: pokemon.nickname,
        iv_hp: pokemon.ivs.hp,
        iv_atk: pokemon.ivs.atk,
        iv_def: pokemon.ivs.def,
        iv_sp_atk: pokemon.ivs.sp_atk,
        iv_sp_def: pokemon.ivs.sp_def,
        iv_speed: pokemon.ivs.speed,
        ev_hp: pokemon.evs.hp,
        ev_atk: pokemon.evs.atk,
        ev_def: pokemon.evs.def,
        ev_sp_atk: pokemon.evs.sp_atk,
        ev_sp_def: pokemon.evs.sp_def,
        ev_speed: pokemon.evs.speed,
        notes: pokemon.notes?.text,
        roles: pokemon.notes?.roles ?? [],
      }).returning();

      await tx.insert(teams_pokemons_moves).values(
        pokemon.moves.map((moveId) => ({ teams_pokemon_id: newTeamPokemon.id, move_id: moveId }))
      );
    }

    return { id: newTeam.id };
  });
}

export async function updateTeam(teamId: number, data: TeamData, userId: number) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new AppError(404, "Team not found");
  if (team.userId !== userId) throw new AppError(403, "Forbidden");

  const validation = validateTeam(data);
  if (!validation.valid) throw new AppError(400, validation.error);

  await db.transaction(async (tx) => {
    await tx.update(teams).set({
      name: data.name,
      description: data.description,
      format_id: data.formatId,
    }).where(eq(teams.id, teamId));

    await tx.delete(teams_pokemons).where(eq(teams_pokemons.team_id, teamId));

    for (const pokemon of data.pokemons) {
      const [newTeamPokemon] = await tx.insert(teams_pokemons).values({
        team_id: teamId,
        pokemon_id: pokemon.pokemonId,
        ability_id: pokemon.abilityId,
        nature_id: pokemon.natureId,
        item_id: pokemon.itemId,
        level: validation.level,
        gender: pokemon.gender,
        shiny: pokemon.shiny,
        happiness: pokemon.happiness,
        nickname: pokemon.nickname,
        iv_hp: pokemon.ivs.hp,
        iv_atk: pokemon.ivs.atk,
        iv_def: pokemon.ivs.def,
        iv_sp_atk: pokemon.ivs.sp_atk,
        iv_sp_def: pokemon.ivs.sp_def,
        iv_speed: pokemon.ivs.speed,
        ev_hp: pokemon.evs.hp,
        ev_atk: pokemon.evs.atk,
        ev_def: pokemon.evs.def,
        ev_sp_atk: pokemon.evs.sp_atk,
        ev_sp_def: pokemon.evs.sp_def,
        ev_speed: pokemon.evs.speed,
        notes: pokemon.notes?.text,
        roles: pokemon.notes?.roles ?? [],
      }).returning();

      await tx.insert(teams_pokemons_moves).values(
        pokemon.moves.map((moveId) => ({ teams_pokemon_id: newTeamPokemon.id, move_id: moveId }))
      );
    }
  });

  return { id: teamId };
}

export async function deleteTeam(teamId: number, userId: number) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new AppError(404, "Team not found");
  if (team.userId !== userId) throw new AppError(403, "Forbidden");
  await db.delete(teams).where(eq(teams.id, teamId));
}

export async function likeTeam(teamId: number, userId: number) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new AppError(404, "Team not found");
  try {
    await db.insert(team_likes).values({ user_id: userId, team_id: teamId });
  } catch (error: any) {
    if (error?.code === "23505") throw new AppError(409, "Already liked");
    throw error;
  }
}

export async function unlikeTeam(teamId: number, userId: number) {
  await db.delete(team_likes).where(
    and(eq(team_likes.user_id, userId), eq(team_likes.team_id, teamId))
  );
}
