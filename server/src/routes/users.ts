import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import z from 'zod';
import * as userService from '../services/userService';

const router = Router();

const patchUserSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().min(8).refine(val => new TextEncoder().encode(val).length <= 72, "password must be at most 72 UTF-8 bytes").optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(255).optional(),
    currentPassword: z.string().optional(),
}).superRefine((data, ctx) => {
    if ((data.email || data.password) && !data.currentPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "currentPassword is required when updating email or password",
            path: ["currentPassword"],
        });
    }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: "Invalid id" });

    try {
        const result = await userService.getUser(userId, req.userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

router.patch('/:id', authenticateToken, async (req, res, next) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) return res.status(400).json({ error: "Invalid id" });

    const parsed = patchUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors });

    try {
        const result = await userService.updateUser(userId, parsed.data, req.userId!);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
