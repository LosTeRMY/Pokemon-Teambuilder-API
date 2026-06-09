import express from 'express';
import authRouter from './routes/auth';
import gamedataRouter from './routes/gamedata';
import teamsRouter from './routes/teams';
import usersRouter from './routes/users';

const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use('/gamedata', gamedataRouter);
app.use('/teams', teamsRouter);

app.get('/health', (req, res) => {
    res.json({status: 'ok'});
});

app.use('/users', usersRouter);

export default app;