import 'dotenv/config';
import app from './app';

if (!process.env.DATABASE_URL) {
    console.error('Missing required env var: DATABASE_URL');
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.error('Missing required env var: JWT_SECRET');
    process.exit(1);
}

const port = parseInt(process.env.PORT ?? '3000', 10);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}).on('error', (err) => {
    console.error('Server error:', err);
});
