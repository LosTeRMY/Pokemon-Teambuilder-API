import { Router } from "express";
import { db } from "../db";
import { users } from "../db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password, username } = req.body;

  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (existingUser.length > 0) {
    return res.status(400).json({ error: "User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user
  const newUser = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      username: username,
    })
    .returning();

  res
    .status(201)
    .json({
      id: newUser[0].id,
      email: newUser[0].email,
      username: newUser[0].username,
    });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Find the user by email
  const user = await db.select().from(users).where(eq(users.email, email));
  if (user.length === 0) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // Check the password
  const isMatch = await bcrypt.compare(password, user[0].password);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid email or password" });
  }

  // Generate a JWT token
  const token = jwt.sign(
    { userId: user[0].id },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
  );

  res.json({ token });
});

export default router;
