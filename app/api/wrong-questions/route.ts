import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { badRequest, ok, optionalString, requiredString, serverError } from "@/lib/http";
import type { WrongQuestion } from "@/lib/types";

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

    const result = await query<WrongQuestion>(
      "select * from wrong_questions where child_id = $1 order by created_at desc",
      [childId]
    );
    return ok({ wrongQuestions: result.rows });
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
    const imageUrl = optionalString(body.image_url);
    const sourceName = optionalString(body.source_name) || "画像アップロード";
    const questionNo =
      optionalString(body.question_no) ||
      `photo-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`;

    const result = await query<WrongQuestion>(
      `insert into wrong_questions
       (child_id, subject, source_name, question_no, image_url, unit, mistake_reason)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [
        childId,
        requiredString(body.subject, "subject"),
        sourceName,
        questionNo,
        imageUrl,
        optionalString(body.unit),
        optionalString(body.mistake_reason)
      ]
    );

    return ok({ wrongQuestion: result.rows[0] }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
