import { db } from "../db";
import { users } from "../db/schema";
import bcrypt from "bcrypt";
import { eq, sql } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { AppError } from "../errors";

export async function register(data: { email: string; password: string; username: string }) {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  try {
    const [newUser] = await db
      .insert(users)
      .values({ email: data.email, password: hashedPassword, username: data.username })
      .returning();
    return {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      avatar: newUser.avatar,
      bio: newUser.bio,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  } catch (error: any) {
    if ((error?.cause?.code ?? error?.code) === "23505") throw new AppError(409, "Email or username already taken");
    throw error;
  }
}

// A real bcrypt hash of a string nobody will ever type — compared against
// when the email doesn't exist, so login() always pays the same bcrypt cost
// and a timing attack can't distinguish "no such email" from "wrong password".
const DUMMY_HASH = "$2b$12$rn1cnsFVx6/wp9Dyu1d73OI4dISwRTzwTUrbYeHUs5QVpoeyy8y3O";

export async function login(data: { email: string; password: string }) {
  const [user] = await db.select().from(users).where(eq(users.email, data.email));

  const isMatch = await bcrypt.compare(data.password, user?.password ?? DUMMY_HASH);
  if (!user || !isMatch) throw new AppError(400, "Invalid email or password");

  const token = jwt.sign({ userId: user.id, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET!, { expiresIn: "7d" });
  return {
    token,
    user: {
      id: user.id, username: user.username, email: user.email,
      avatar: user.avatar, bio: user.bio, role: user.role, createdAt: user.createdAt,
    },
  };
}

// Bumping tokenVersion makes every JWT issued before this call fail the
// check in middleware/auth.ts, even though the JWTs themselves are still
// cryptographically valid and unexpired.
export async function logoutAll(userId: number) {
  await db.update(users).set({ tokenVersion: sql`${users.tokenVersion} + 1` }).where(eq(users.id, userId));
}

export async function getCurrentUser(userId: number) {
  const [user] = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    avatar: users.avatar,
    bio: users.bio,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, userId));
  if (!user) throw new AppError(404, "User not found");
  return user;
}
