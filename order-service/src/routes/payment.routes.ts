import { Router, Request, Response } from 'express';
import { PrismaClient } from '../generated/prisma/client';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import { sendOrderPaidEmail } from '../utils/email';  // 👈 NEW IMPORT

const router = Router();
const prisma = new PrismaClient();

// Mock Stripe secret key (in real app this comes from env)
const MOCK_STRIPE_KEY = 'sk_test_mock_12345';

// Simple mock delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// POST /api/payments/orders/:orderId/pay
router.post('/orders/:orderId/pay', protect, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;
  const { orderId } = req.params;
  const { paymentMethodId, shouldFail = false } = req.body;

  const order = await prisma.order.findFirst({
    where: { id: Number(orderId), userId },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (order.status !== 'PENDING') {
    return res.status(400).json({ error: `Order is already ${order.status}` });
  }

  try {
    await delay(1200);

    if (shouldFail || !paymentMethodId) {
      throw new Error('Card declined (mock)');
    }

    // SUCCESS PATH — everything inside a transaction
    const paidOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID' },
        include: {
          items: { include: { product: { select: { title: true } } } },
        },
      });

      // 2. SEND EMAIL INSIDE TRANSACTION 👇
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user?.email) {
        await sendOrderPaidEmail(user.email, order.id, order.total);
      }
      // 👆

      console.log(`Order ${order.id} PAID! Emitting OrderPaid event...`);

      return updatedOrder;
    });

    return res.json({
      success: true,
      message: 'Payment successful! Order is now PAID',
      order: paidOrder,
    });

  } catch (error: any) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    return res.status(400).json({
      success: false,
      error: 'Payment failed (mock Stripe): ' + error.message,
    });
  }
});

export default router;

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJDVVNUT01FUiIsImlhdCI6MTc2MzM3OTIzNCwiZXhwIjoxNzYzOTg0MDM0fQ.tXmDEGv9roTkFWpbK7ZZPY1dcYmxcECXBiaTgfV47g8



//admin
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MzM4MDIwMiwiZXhwIjoxNzYzOTg1MDAyfQ.YMwHxYfweTG-eF2zdDFSjvEpbRkd2wqgWY5AIoOfWDc






