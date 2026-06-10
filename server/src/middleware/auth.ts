import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { userId: number };
            req.userId = decoded.userId;
        } catch {}
    }
    next();
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;

    // Check the authorization header exists and starts with "Bearer "
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = header.slice(7)

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};