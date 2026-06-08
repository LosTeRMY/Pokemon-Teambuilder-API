import { Router } from "express";
import { db } from "../db";
import { teams, teams_pokemons, teams_pokemons_moves } from "../db/schema";
import { authenticateToken } from '../middleware/auth';
import { createTeamSchema } from "../schemas/team";
import { validateTeam } from "../services/teamValidation";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const allTeams = await db.select().from(teams);
    res.json(allTeams);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const teamId = Number(req.params.id);

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
    const teamId = Number(req.params.id);

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

    await db.update(teams).set({
      name: parsed.data.name,
      description: parsed.data.description,
      format_id: parsed.data.formatId,
    }).where(eq(teams.id, teamId));

    await db.delete(teams_pokemons).where(eq(teams_pokemons.team_id, teamId));

    for (const pokemon of parsed.data.pokemons) {
      const [newTeamPokemon] = await db.insert(teams_pokemons).values({
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

      await db.insert(teams_pokemons_moves).values(
        pokemon.moves.map(moveId => ({
          teams_pokemon_id: newTeamPokemon.id,
          move_id: moveId,
        }))
      );
    }

    res.json({ id: teamId });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const teamId = Number(req.params.id);

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

export default router;
