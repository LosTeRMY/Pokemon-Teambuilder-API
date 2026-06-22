import { Router } from "express";
import { z } from "zod";
import * as authService from "../services/authService";
import { authenticateToken } from "../middleware/auth";
import { loginLimiter, registerLimiter } from "../middleware/rateLimit";

const router = Router();

const passwordBytes = (val: string) => new TextEncoder().encode(val).length <= 72;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).refine(passwordBytes, "password must be at most 72 UTF-8 bytes"),
  username: z.string().min(3).max(60),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).refine(passwordBytes, "password must be at most 72 UTF-8 bytes"),
});

router.post("/register", registerLimiter, async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

  try {
    const result = await authService.register(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

  try {
    const result = await authService.login(parsed.data);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/me", authenticateToken, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.userId!);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Invalidates every token issued before this call (see middleware/auth.ts) —
// the one that's about to be sent to fulfill this very request included, so
// the caller is logged out everywhere, this device too.
router.post("/logout-all", authenticateToken, async (req, res, next) => {
  try {
    await authService.logoutAll(req.userId!);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
