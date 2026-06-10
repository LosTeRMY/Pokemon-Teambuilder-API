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

const rawPort = process.env.PORT ?? '3000';
if (!/^\d+$/.test(rawPort)) {
    console.error(`Invalid PORT: "${rawPort}" — must be a non-negative integer`);
    process.exit(1);
}
const port = parseInt(rawPort, 10);
if (port > 65535) {
    console.error(`Invalid PORT: ${port} — must be between 0 and 65535`);
    process.exit(1);
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}).on('error', (err) => {
    console.error('Server error:', err);
});
