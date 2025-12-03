import express from 'express';
import dotenv from 'dotenv';
import productRoutes from './routes/product.routes';
import { protect, adminOnly } from './middleware/auth.middleware';
import {createClient} from 'redis';

dotenv.config();
const app = express();
app.use(express.json());

// REDIS CLIENT
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379'
});
redisClient.on('error', (err) => console.log('Redis Error:', err));

async function startServer() {
  await redisClient.connect();
  (app as any).redisClient = redisClient;

(app as any).redisClient = redisClient;
}
// Public routes
// app.use('/api/products', productRoutes);
app.use('/', productRoutes);


app.get('/', (_, res) => res.json({ message: 'Product Service Running' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Product Service → http://localhost:${PORT}`);
});

startServer();