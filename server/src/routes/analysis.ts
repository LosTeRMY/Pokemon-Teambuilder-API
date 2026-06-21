import { Router } from "express";
import { authenticateToken, optionalAuth, requireRole } from "../middleware/auth";
import { analysisPageSchema, setSchema, proposalSchema } from "../schemas/analysis";
import * as analysisService from "../services/analysisService";

const router = Router();

function parseId(param: string | string[]): number | null {
  const value = Array.isArray(param) ? param[0] : param;
  return /^[1-9]\d*$/.test(value) ? Number(value) : null;
}

router.get("/:pokemonId", optionalAuth, async (req, res, next) => {
  const pokemonId = parseId(req.params.pokemonId);
  if (!pokemonId) return res.status(400).json({ error: "Invalid pokemonId" });

  try {
    const result = await analysisService.getAnalysis(pokemonId, req.userId);
    res.json(result); // null when nobody's contributed to this Pokémon yet — not a 404
  } catch (err) {
    next(err);
  }
});

router.patch("/:pokemonId", authenticateToken, async (req, res, next) => {
  const pokemonId = parseId(req.params.pokemonId);
  if (!pokemonId) return res.status(400).json({ error: "Invalid pokemonId" });

  const parsed = analysisPageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

  try {
    const result = await analysisService.upsertAnalysisPage(pokemonId, parsed.data, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/:pokemonId/sets", authenticateToken, async (req, res, next) => {
  const pokemonId = parseId(req.params.pokemonId);
  if (!pokemonId) return res.status(400).json({ error: "Invalid pokemonId" });

  const parsed = setSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

  try {
    const result = await analysisService.createSet(pokemonId, parsed.data, req.userId!);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.patch("/sets/:setId", authenticateToken, async (req, res, next) => {
  const setId = parseId(req.params.setId);
  if (!setId) return res.status(400).json({ error: "Invalid setId" });

  const parsed = setSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

  try {
    const result = await analysisService.updateSet(setId, parsed.data, req.userId!);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/:pokemonId/proposals", authenticateToken, async (req, res, next) => {
  const pokemonId = parseId(req.params.pokemonId);
  if (!pokemonId) return res.status(400).json({ error: "Invalid pokemonId" });

  const parsed = proposalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

  try {
    const result = await analysisService.createProposal(pokemonId, parsed.data, req.userId!);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/proposals/:id/votes", authenticateToken, async (req, res, next) => {
  const proposalId = parseId(req.params.id);
  if (!proposalId) return res.status(400).json({ error: "Invalid id" });

  try {
    await analysisService.voteProposal(proposalId, req.userId!);
    res.status(201).send();
  } catch (err) {
    next(err);
  }
});

router.delete("/proposals/:id/votes", authenticateToken, async (req, res, next) => {
  const proposalId = parseId(req.params.id);
  if (!proposalId) return res.status(400).json({ error: "Invalid id" });

  try {
    await analysisService.unvoteProposal(proposalId, req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post("/proposals/:id/accept", authenticateToken, requireRole("moderator", "admin"), async (req, res, next) => {
  const proposalId = parseId(req.params.id);
  if (!proposalId) return res.status(400).json({ error: "Invalid id" });

  try {
    const result = await analysisService.acceptProposal(proposalId, req.userId!);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/proposals/:id/reject", authenticateToken, requireRole("moderator", "admin"), async (req, res, next) => {
  const proposalId = parseId(req.params.id);
  if (!proposalId) return res.status(400).json({ error: "Invalid id" });

  try {
    await analysisService.rejectProposal(proposalId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
