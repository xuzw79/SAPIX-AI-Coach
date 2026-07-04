import { NextResponse } from "next/server";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password || password.length < 8) {
      return badRequest("メールアドレスと8文字以上のパスワードを入力してください。");
    }

    const passwordHash = await hashPassword(password);
    const result = await query<{ id: string; email: string }>(
      "insert into users (email, password_hash) values ($1, $2) returning id, email",
      [email, passwordHash]
    );

    const response = ok({ user: result.rows[0] });
    setSessionCookie(response as NextResponse, result.rows[0]);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return badRequest("このメールアドレスはすでに登録されています。");
    }
    return serverError(error);
  }
}
