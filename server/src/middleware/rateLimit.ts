import rateLimit from 'express-rate-limit';

// Keyed by IP (express-rate-limit's default) — enough to stop scripted
// brute-forcing/registration-spam without needing per-account state.
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts — try again in 15 minutes' },
});

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many accounts created from this address — try again in an hour' },
});
