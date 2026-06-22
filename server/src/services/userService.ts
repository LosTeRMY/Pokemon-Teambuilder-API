import { db } from "../db";
import { users, teams } from "../db/schema";
import { eq, asc, desc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { AppError } from "../errors";

export type Role = "user" | "moderator" | "admin";

export async function getUser(userId: number, requestingUserId?: number) {
  const [user] = await db.select({
    id: users.id,
    username: users.username,
    avatar: users.avatar,
    bio: users.bio,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, userId));

  if (!user) throw new AppError(404, "User not found");

  const likesCount = sql<number>`(SELECT COUNT(*) FROM team_likes WHERE team_likes.team_id = ${teams.id})`.as('likes_count');
  const liked = requestingUserId
    ? sql<boolean>`EXISTS (SELECT 1 FROM team_likes WHERE team_likes.team_id = ${teams.id} AND team_likes.user_id = ${requestingUserId})`.as('liked')
    : sql<null>`NULL`.as('liked');

  const userTeams = await db.select({
    id: teams.id,
    name: teams.name,
    description: teams.description,
    format_id: teams.format_id,
    createdAt: teams.createdAt,
    likes_count: likesCount,
    liked,
  }).from(teams).where(eq(teams.userId, userId)).orderBy(desc(teams.createdAt));

  return { ...user, teams: userTeams };
}

type UpdateUserData = {
  email?: string;
  password?: string;
  avatar?: string;
  bio?: string;
  currentPassword?: string;
};

export async function updateUser(userId: number, data: UpdateUserData, requestingUserId: number) {
  if (requestingUserId !== userId) throw new AppError(403, "Forbidden");

  const [existingUser] = await db.select({ id: users.id, password: users.password })
    .from(users).where(eq(users.id, userId));
  if (!existingUser) throw new AppError(404, "User not found");

  if (data.email || data.password) {
    const valid = await bcrypt.compare(data.currentPassword!, existingUser.password);
    if (!valid) throw new AppError(401, "Incorrect current password");
  }

  const updates: Record<string, unknown> = {};
  if (data.email) updates.email = data.email;
  if (data.avatar !== undefined) updates.avatar = data.avatar === "" ? null : data.avatar;
  if (data.bio !== undefined) updates.bio = data.bio;
  // Changing the password invalidates every other session — anyone holding
  // an older token (e.g. from a leaked device) gets logged out by it.
  if (data.password) {
    updates.password = await bcrypt.hash(data.password, 12);
    updates.tokenVersion = sql`${users.tokenVersion} + 1`;
  }

  if (Object.keys(updates).length === 0) throw new AppError(400, "No fields to update");

  try {
    await db.update(users).set(updates).where(eq(users.id, userId));
  } catch (error: any) {
    if ((error?.cause?.code ?? error?.code) === "23505") throw new AppError(409, "Email already in use");
    throw error;
  }

  return { id: userId };
}

// Admin-only — see routes/users.ts. Deliberately separate from updateUser()
// above: that's self-service profile editing with an ownership check;
// this is one admin acting on someone else's permissions, and the two
// shouldn't share a code path or an "is this my own account" guard.
export async function listUsers() {
  return db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).orderBy(asc(users.username));
}

export async function updateUserRole(targetUserId: number, role: Role, requestingUserId: number) {
  // Without this, an admin could demote themselves to "user" and lock
  // everyone out of role management until someone runs a manual DB update.
  if (targetUserId === requestingUserId) throw new AppError(400, "Can't change your own role");

  const [updated] = await db.update(users).set({ role }).where(eq(users.id, targetUserId))
    .returning({ id: users.id, username: users.username, role: users.role });
  if (!updated) throw new AppError(404, "User not found");

  return updated;
}
