import { db } from "../db";
import { users } from "../db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { AppError } from "../errors";

export async function register(data: { email: string; password: string; username: string }) {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  try {
    const [newUser] = await db
      .insert(users)
      .values({ email: data.email, password: hashedPassword, username: data.username })
      .returning();
    return { id: newUser.id, email: newUser.email, username: newUser.username };
  } catch (error: any) {
    if (error?.code === "23505") throw new AppError(409, "Email or username already taken");
    throw error;
  }
}

export async function login(data: { email: string; password: string }) {
  const [user] = await db.select().from(users).where(eq(users.email, data.email));
  if (!user) throw new AppError(400, "Invalid email or password");

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new AppError(400, "Invalid email or password");

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  return { token };
}
