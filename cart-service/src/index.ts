import express from 'express';
import dotenv from 'dotenv';
import cartRoutes from './routes/cart.routes';
import { protect } from './middleware/auth.middleware';

dotenv.config();
const app = express();
app.use(express.json());

app.use(protect);                    // All cart routes need login
app.use('/api/cart', cartRoutes);

app.get('/', (_, res) => res.json({ message: 'Cart Service Running' }));

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Cart Service → http://localhost:${PORT}`);
});