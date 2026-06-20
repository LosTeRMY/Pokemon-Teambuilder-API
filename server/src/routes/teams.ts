import { Router } from "express";
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { createTeamSchema } from "../schemas/team";
import * as teamService from "../services/teamService";

const router = Router();

function parseId(param: string | string[]): number | null {
  const value = Array.isArray(param) ? param[0] : param;
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const results = await teamService.listTeams(req.query, req.userId);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get("/format-counts", async (req, res, next) => {
  try {
    const counts = await teamService.getFormatCounts();
    res.json(counts);
  } catch (err) {
    next(err);
  }
});

router.get("/count", optionalAuth, async (req, res, next) => {
  try {
    const total = await teamService.countTeams(req.query, req.userId);
    res.json({ total });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  const teamId = parseId(req.params.id);
  if (!teamId) return res.status(400).json({ error: "Invalid id" });

  try {
    const team = await teamService.getTeam(teamId);
    res.json(team);
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticateToken, async (req, res, next) => {
  const parsed = createTeamSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

  try {
    const result = await teamService.createTeam(parsed.data, req.userId!);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", authenticateToken, async (req, res, next) => {
  const teamId = parseId(req.params.id);
  if (!teamId) return res.status(400).json({ error: "Invalid id" });

  const parsed = createTeamSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

  try {
    const result = await teamService.updateTeam(teamId, parsed.data, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticateToken, async (req, res, next) => {
  const teamId = parseId(req.params.id);
  if (!teamId) return res.status(400).json({ error: "Invalid id" });

  try {
    await teamService.deleteTeam(teamId, req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post("/:id/likes", authenticateToken, async (req, res, next) => {
  const teamId = parseId(req.params.id);
  if (!teamId) return res.status(400).json({ error: "Invalid id" });

  try {
    await teamService.likeTeam(teamId, req.userId!);
    res.status(201).send();
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/likes", authenticateToken, async (req, res, next) => {
  const teamId = parseId(req.params.id);
  if (!teamId) return res.status(400).json({ error: "Invalid id" });

  try {
    await teamService.unlikeTeam(teamId, req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
