import { Router } from "express";
import { db } from "../db";
import { teams, teams_pokemons, teams_pokemons_moves, team_likes } from "../db/schema";
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { createTeamSchema } from "../schemas/team";
import { validateTeam } from "../services/teamValidation";
import { eq, and, ilike, sql, desc, asc, count } from "drizzle-orm";

const router = Router();

function parseId(param: string | string[]): number | null {
  const value = Array.isArray(param) ? param[0] : param;
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const pokemonFilter = req.query.pokemon ? Number(req.query.pokemon) : null;
    const moveFilter = req.query.move ? Number(req.query.move) : null;
    const abilityFilter = req.query.ability ? Number(req.query.ability) : null;
    const itemFilter = req.query.item ? Number(req.query.item) : null;
    const formatFilter = req.query.format ? Number(req.query.format) : null;
    const nameFilter = req.query.name as string | undefined;
    const userFilter = req.query.user ? Number(req.query.user) : null;
    const sort = (req.query.sort as string) || "newest";

    let likedByUserId: number | null = null;
    const likedBy = req.query.liked_by as string | undefined;
    if (likedBy === "me") {
      likedByUserId = req.userId ?? null;
    } else if (likedBy) {
      likedByUserId = Number(likedBy) || null;
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
    if (likedByUserId) conditions.push(
      sql`EXISTS (SELECT 1 FROM team_likes WHERE team_likes.team_id = ${teams.id} AND team_likes.user_id = ${likedByUserId})`
    );

    const likesCount = sql<number>`(SELECT COUNT(*) FROM team_likes WHERE team_likes.team_id = ${teams.id})`.as('likes_count');
    const liked = req.userId
      ? sql<boolean>`EXISTS (SELECT 1 FROM team_likes WHERE team_likes.team_id = ${teams.id} AND team_likes.user_id = ${req.userId})`.as('liked')
      : sql<null>`NULL`.as('liked');

    const orderBy = sort === "oldest"
      ? asc(teams.createdAt)
      : sort === "popular"
        ? desc(sql`(SELECT COUNT(*) FROM team_likes WHERE team_likes.team_id = ${teams.id})`)
        : desc(teams.createdAt);

    const results = await db
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

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const teamId = parseId(req.params.id);
    if (!teamId) return res.status(400).json({ error: "Invalid id" });

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    const pokemonRows = await db.select().from(teams_pokemons).where(eq(teams_pokemons.team_id, teamId));

    const pokemons = await Promise.all(
      pokemonRows.map(async (p) => {
        const moveRows = await db.select().from(teams_pokemons_moves).where(eq(teams_pokemons_moves.teams_pokemon_id, p.id));
        return {
          ...p,
          moves: moveRows.map(m => m.move_id),
        };
      })
    );

    res.json({ ...team, pokemons });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const teamId = parseId(req.params.id);
    if (!teamId) return res.status(400).json({ error: "Invalid id" });

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (team.userId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const parsed = createTeamSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const validation = validateTeam(parsed.data);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    await db.transaction(async (tx) => {
      await tx.update(teams).set({
        name: parsed.data.name,
        description: parsed.data.description,
        format_id: parsed.data.formatId,
      }).where(eq(teams.id, teamId));

      await tx.delete(teams_pokemons).where(eq(teams_pokemons.team_id, teamId));

      for (const pokemon of parsed.data.pokemons) {
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
          pokemon.moves.map(moveId => ({
            teams_pokemon_id: newTeamPokemon.id,
            move_id: moveId,
          }))
        );
      }
    });

    res.json({ id: teamId });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const teamId = parseId(req.params.id);
    if (!teamId) return res.status(400).json({ error: "Invalid id" });

    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }
    if (team.userId !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await db.delete(teams).where(eq(teams.id, teamId));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
    const parsed = createTeamSchema.safeParse(req.body);
    if (!parsed.success){
        return res.status(400).json({ error: parsed.error.flatten().fieldErrors})
    }
    const validation = validateTeam(parsed.data);
    if (!validation.valid){
        return res.status(400).json({ error: validation.error })
    }

    const [newTeam] = await db.insert(teams).values({
        name: parsed.data.name,
        description: parsed.data.description,
        userId: req.userId,
        format_id: parsed.data.formatId,
    }).returning();

    for (const pokemon of parsed.data.pokemons) {
        const [newTeamPokemon] = await db.insert(teams_pokemons).values({
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

        await db.insert(teams_pokemons_moves).values(
            pokemon.moves.map(moveId => ({
                teams_pokemon_id: newTeamPokemon.id,
                move_id: moveId,
            }))
        );
    }

    res.status(201).json({ id: newTeam.id });
});

router.post("/:id/likes", authenticateToken, async (req, res) => {
    try {
        const teamId = parseId(req.params.id);
        if (!teamId) return res.status(400).json({ error: "Invalid id" });

        const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
        if (!team) return res.status(404).json({ error: "Team not found" });

        await db.insert(team_likes).values({
            user_id: req.userId!,
            team_id: teamId,
        });

        res.status(201).send();
    } catch (error: any) {
        if (error?.code === "23505") {
            return res.status(409).json({ error: "Already liked" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete("/:id/likes", authenticateToken, async (req, res) => {
    try {
        const teamId = parseId(req.params.id);
        if (!teamId) return res.status(400).json({ error: "Invalid id" });

        await db.delete(team_likes).where(
            and(eq(team_likes.user_id, req.userId!), eq(team_likes.team_id, teamId))
        );

        res.status(204).send();
    } catch {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
