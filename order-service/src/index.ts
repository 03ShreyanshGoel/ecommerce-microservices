import express from 'express';
import dotenv from 'dotenv';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import { protect, adminOnly } from './middleware/auth.middleware';

dotenv.config();
const app = express();
app.use(express.json());

app.use(protect);           // All routes need login
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/', (_, res) => res.json({ message: 'Order + Payment Service Running' }));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Order Service → http://localhost:${PORT}`);
});