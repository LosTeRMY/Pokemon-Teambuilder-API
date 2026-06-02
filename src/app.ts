import express from 'express';
import router from './routes/auth';

const app = express();

app.use(express.json());
console.log('Registering auth router:', typeof router);
app.use('/auth', router);

app.get('/health', (req, res) => {
    res.json({status: 'ok'});
});

export default app;