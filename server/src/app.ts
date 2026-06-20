import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import gamedataRouter from './routes/gamedata';
import teamsRouter from './routes/teams';
import usersRouter from './routes/users';
import { AppError } from './errors';

const app = express();

// cors() silently falls back to Access-Control-Allow-Origin: * when origin is
// falsy — fail loudly instead of allowing any origin to make credentialed requests.
if (!process.env.CLIENT_ORIGIN) {
    console.error('Missing required env var: CLIENT_ORIGIN');
    process.exit(1);
}
app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use('/auth', authRouter);
app.use('/gamedata', gamedataRouter);
app.use('/teams', teamsRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/users', usersRouter);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

export default app;
