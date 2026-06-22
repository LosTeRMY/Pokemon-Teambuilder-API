import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// JWTs are otherwise stateless — this DB round trip is what makes them
// revocable (logoutAll / a password change bumps tokenVersion, see
// authService.ts and userService.ts). Returns true if the token's embedded
// tokenVersion still matches the user's current one.
async function tokenStillValid(decoded: { userId: number; tokenVersion?: number }): Promise<boolean> {
    const [user] = await db.select({ tokenVersion: users.tokenVersion }).from(users).where(eq(users.id, decoded.userId));
    return !!user && user.tokenVersion === decoded.tokenVersion;
}

// A bad/expired/missing token is an expected, everyday case — treat it as
// "not authenticated". A thrown DB error from tokenStillValid() is not
// expected, and swallowing it here would both mislabel a real 500 as a 401
// and hide it from app.ts's error logging entirely — so the two are kept in
// separate try/catches and only the JWT one is ever silenced.
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        let decoded: { userId: number; tokenVersion: number } | null = null;
        try {
            decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { userId: number; tokenVersion: number };
        } catch {
            decoded = null;
        }
        if (decoded) {
            try {
                if (await tokenStillValid(decoded)) req.userId = decoded.userId;
            } catch (err) {
                return next(err);
            }
        }
    }
    next();
};

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    // Check the authorization header exists and starts with "Bearer "
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = header.slice(7)

    let decoded: { userId: number; tokenVersion: number };
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; tokenVersion: number };
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        if (!(await tokenStillValid(decoded))) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } catch (err) {
        return next(err);
    }

    req.userId = decoded.userId;
    next();
};

// Must run after authenticateToken (needs req.userId). No self-service way to
// grant moderator/admin yet — set users.role directly in the DB for now.
export const requireRole = (...roles: Array<'moderator' | 'admin'>) =>
    async (req: Request, res: Response, next: NextFunction) => {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, req.userId));
        if (!user || !roles.includes(user.role as 'moderator' | 'admin')) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };