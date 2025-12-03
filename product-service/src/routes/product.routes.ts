import { Router, Request, Response } from "express";
import { PrismaClient } from "../generated/prisma/client";
import { protect, adminOnly, AuthRequest } from "../middleware/auth.middleware";

const router = Router();
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
// Helper: Invalidate all product caches
const redisClient = (require("express").application as any).redisClient;
const invalidateProductCache = async () => {
  await redisClient.del("products:all");
};

// GET all products (public)
router.get("/", async (req: Request, res: Response) => {
  const CACHE_KEY = "products:all";
  try {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) return res.json(JSON.parse(cached));

    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        image: true,
        stock: true,
      },
    });
    await redisClient.setEx(CACHE_KEY, 60, JSON.stringify(products));
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET one product
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const CACHE_KEY = `product:${id}`;
  try {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) return res.json(JSON.parse(cached));
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        image: true,
        stock: true,
      },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });
    await redisClient.setEx(CACHE_KEY, 300, JSON.stringify(product));
    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// CREATE product (admin only)
router.post(
  "/",
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    const { title, description, price, image, stock } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: "Title and price are required" });
    }

    try {
      const product = await prisma.product.create({
        data: { title, description, price, image, stock },
        select: { id: true, title: true, price: true, stock: true },
      });
      await invalidateProductCache();
      res.status(201).json(product);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);

// UPDATE product (admin only)
router.put(
  "/:id",
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, description, price, image, stock } = req.body;

    try {
      const product = await prisma.product.update({
        where: { id: Number(id) },
        data: { title, description, price, image, stock },
        select: { id: true, title: true, price: true, stock: true },
      });

      // Invalidate both list and single item cache
      await invalidateProductCache();
      await redisClient.del(`product:${id}`);
      res.json(product);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }
      console.log(error);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);

// DELETE product (admin only)
router.delete(
  "/:id",
  protect,
  adminOnly,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
      await prisma.product.delete({ where: { id: Number(id) } });

      // Invalidate both caches
      await invalidateProductCache();
      await redisClient.del(`product:${id}`);

      res.json({ message: "Product deleted" });
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Product not found" });
      }
      console.log(error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
);

export default router;
