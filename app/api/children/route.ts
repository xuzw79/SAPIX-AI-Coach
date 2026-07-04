import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { badRequest, ok, optionalString, requiredString, serverError } from "@/lib/http";
import type { Child } from "@/lib/types";

export async function GET() {
  try {
    const user = await requireUser();
    const result = await query<Child>(
      "select * from children where user_id = $1 order by created_at desc",
      [user.id]
    );
    return ok({ children: result.rows });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const name = requiredString(body.name, "name");
    const grade = requiredString(body.grade, "grade");
    const schoolType = optionalString(body.school_type) || "SAPIX";
    const targetSchools = String(body.target_schools || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!name || !grade) return badRequest("名前と学年は必須です。");

    const result = await query<Child>(
      `insert into children (user_id, name, grade, school_type, target_schools)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [user.id, name, grade, schoolType, targetSchools]
    );

    return ok({ child: result.rows[0] }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
