import { Router } from 'express';
import { db } from '../db';
import { users, teams } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';
import bcrypt from 'bcrypt';
import z from 'zod';

const router = Router();

const patchUserSchema = z.object({
    email: z.string().email().optional(),
    password: z.string().min(8).max(72).optional(),
    avatar: z.string().url().optional(),
    bio: z.string().max(255).optional(),
    currentPassword: z.string().optional(),
}).refine(data => {
    if ((data.email || data.password) && !data.currentPassword) {
        return false;
    }
    return true;
}, { message: "currentPassword is required when updating email or password" });

router.get('/:id', async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ error: "Invalid id" });
        }

        const [user] = await db.select({
            id: users.id,
            username: users.username,
            avatar: users.avatar,
            bio: users.bio,
            createdAt: users.createdAt,
        }).from(users).where(eq(users.id, userId));

        if (!user) return res.status(404).json({ error: "User not found" });

        const userTeams = await db.select({
            id: teams.id,
            name: teams.name,
            description: teams.description,
            format_id: teams.format_id,
            createdAt: teams.createdAt,
        }).from(teams).where(eq(teams.userId, userId)).orderBy(desc(teams.createdAt));

        res.json({ ...user, teams: userTeams });
    } catch {
        res.status(500).json({ error: "Internal server error" });
    }
});

router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ error: "Invalid id" });
        }

        if (req.userId !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const parsed = patchUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        }

        const { email, password, avatar, bio, currentPassword } = parsed.data;

        if (email || password) {
            const [user] = await db.select({ password: users.password }).from(users).where(eq(users.id, userId));
            const valid = await bcrypt.compare(currentPassword!, user.password);
            if (!valid) {
                return res.status(401).json({ error: "Incorrect current password" });
            }
        }

        const updates: Record<string, unknown> = {};
        if (email) updates.email = email;
        if (avatar !== undefined) updates.avatar = avatar;
        if (bio !== undefined) updates.bio = bio;
        if (password) updates.password = await bcrypt.hash(password, 12);

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        await db.update(users).set(updates).where(eq(users.id, userId));

        res.json({ id: userId });
    } catch {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
