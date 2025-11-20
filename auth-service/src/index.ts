import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();
const app = express();
app.use(express.json());

// ONLY auth routes
app.use('/api/auth', authRoutes);

app.get('/', (_, res) => res.json({ message: 'Auth Service Running' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Auth Service → http://localhost:${PORT}`);
});