import { NextResponse } from "next/server";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { badRequest, ok, serverError } from "@/lib/http";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
    }>("select id, email, password_hash from users where email = $1", [email]);

    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return badRequest("メールアドレスまたはパスワードが違います。");
    }

    const response = ok({ user: { id: user.id, email: user.email } });
    setSessionCookie(response as NextResponse, user);
    return response;
  } catch (error) {
    return serverError(error);
  }
}
