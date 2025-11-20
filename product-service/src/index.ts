import express from 'express';
import dotenv from 'dotenv';
import productRoutes from './routes/product.routes';
import { protect, adminOnly } from './middleware/auth.middleware'

dotenv.config();
const app = express();
app.use(express.json());

// Public routes
app.use('/api/products', productRoutes);

// These two lines are still needed for admin protection
app.use(protect);
app.use(adminOnly);

app.get('/', (_, res) => res.json({ message: 'Product Service Running' }));

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Product Service → http://localhost:${PORT}`);
});