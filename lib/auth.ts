import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const COOKIE_NAME = "sapiai_session";

export type SessionUser = {
  id: string;
  email: string;
};

type TokenPayload = {
  userId: string;
  email: string;
};

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set.");
  }
  return secret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function setSessionCookie(response: NextResponse, user: SessionUser) {
  const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), {
    expiresIn: "30d"
  });

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, jwtSecret()) as TokenPayload;
    const result = await query<SessionUser>(
      "select id, email from users where id = $1",
      [payload.userId]
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return user;
}

export function isAuthError(error: unknown) {
  return error instanceof Response && error.status === 401;
}
