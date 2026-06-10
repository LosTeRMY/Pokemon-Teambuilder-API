import { db } from "../db";
import { teams, teams_pokemons, teams_pokemons_moves, team_likes } from "../db/schema";
import { eq, and, ilike, sql, desc, asc } from "drizzle-orm";
import { createTeamSchema } from "../schemas/team";
import { validateTeam } from "./teamValidation";
import { AppError } from "../errors";
import z from "zod";

type TeamData = z.infer<typeof createTeamSchema>;

export async function listTeams(query: Record<string, unknown>, requestingUserId?: number) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const pokemonFilter = query.pokemon ? Number(query.pokemon) : null;
  const moveFilter = query.move ? Number(query.move) : null;
  const abilityFilter = query.ability ? Number(query.ability) : null;
  const itemFilter = query.item ? Number(query.item) : null;
  const formatFilter = query.format ? Number(query.format) : null;
  const nameFilter = query.name as string | undefined;
  const userFilter = query.user ? Number(query.user) : null;
  const sort = (query.sort as string) || "newest";

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
  if (pokemonFilter) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons WHERE teams_pokemons.team_id = ${teams.id} AND teams_pokemons.pokemon_id = ${pokemonFilter})`
  );
  if (abilityFilter) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons WHERE teams_pokemons.team_id = ${teams.id} AND teams_pokemons.ability_id = ${abilityFilter})`
  );
  if (itemFilter) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons WHERE teams_pokemons.team_id = ${teams.id} AND teams_pokemons.item_id = ${itemFilter})`
  );
  if (moveFilter) conditions.push(
    sql`EXISTS (SELECT 1 FROM teams_pokemons tp JOIN teams_pokemons_moves tpm ON tpm.teams_pokemon_id = tp.id WHERE tp.team_id = ${teams.id} AND tpm.move_id = ${moveFilter})`
  );
  if (likedByUserId !== null) conditions.push(
    sql`EXISTS (SELECT 1 FROM team_likes WHERE team_likes.team_id = ${teams.id} AND team_likes.user_id = ${likedByUserId})`
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

  return db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      userId: teams.userId,
      format_id: teams.format_id,
      createdAt: teams.createdAt,
      likes_count: likesCount,
      liked,
    })
    .from(teams)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function getTeam(teamId: number) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new AppError(404, "Team not found");

  const pokemonRows = await db.select().from(teams_pokemons).where(eq(teams_pokemons.team_id, teamId));
  const pokemons = await Promise.all(
    pokemonRows.map(async (p) => {
      const moveRows = await db.select().from(teams_pokemons_moves).where(eq(teams_pokemons_moves.teams_pokemon_id, p.id));
      return { ...p, moves: moveRows.map((m) => m.move_id) };
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
