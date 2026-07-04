import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { badRequest, ok, optionalNumber, optionalString, requiredString, serverError } from "@/lib/http";
import type { Test } from "@/lib/types";

async function ensureChildOwned(childId: string, userId: string) {
  const result = await query("select id from children where id = $1 and user_id = $2", [
    childId,
    userId
  ]);
  return result.rowCount === 1;
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");
    if (!childId || !(await ensureChildOwned(childId, user.id))) {
      return badRequest("childId is invalid.");
    }

    const result = await query<Test>(
      "select * from tests where child_id = $1 order by test_date desc, created_at desc",
      [childId]
    );
    return ok({ tests: result.rows });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const childId = requiredString(body.child_id, "child_id");
    if (!(await ensureChildOwned(childId, user.id))) return badRequest("childId is invalid.");

    const result = await query<Test>(
      `insert into tests (child_id, test_name, test_date, subject, score, deviation_value, memo)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        childId,
        requiredString(body.test_name, "test_name"),
        requiredString(body.test_date, "test_date"),
        requiredString(body.subject, "subject"),
        optionalNumber(body.score),
        optionalNumber(body.deviation_value),
        optionalString(body.memo)
      ]
    );

    return ok({ test: result.rows[0] }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
