import { Router } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { z } from "zod";

const router = Router();

const passwordBytes = (val: string) => new TextEncoder().encode(val).length <= 72;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).refine(passwordBytes, "password must be at most 72 UTF-8 bytes"),
  username: z.string().min(3).max(60),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).refine(passwordBytes, "password must be at most 72 UTF-8 bytes"),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { email, password, username } = parsed.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db
      .insert(users)
      .values({ email, password: hashedPassword, username })
      .returning();

    return res.status(201).json({
      id: newUser[0].id,
      email: newUser[0].email,
      username: newUser[0].username,
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Email or username already taken" });
    }
    console.error("Register error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { email, password } = parsed.data;

  try {
    const user = await db.select().from(users).where(eq(users.email, email));
    if (user.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user[0].id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
