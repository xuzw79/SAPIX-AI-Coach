import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { generateDailyPlan } from "@/lib/openai";
import { badRequest, ok, requiredString, serverError } from "@/lib/http";
import type { Child, Test, WrongQuestion } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const childId = requiredString(body.child_id, "child_id");
    const nextTestDate = body.next_test_date || null;

    const childResult = await query<Child>(
      "select * from children where id = $1 and user_id = $2",
      [childId, user.id]
    );
    const child = childResult.rows[0];
    if (!child) return badRequest("childId is invalid.");

    const tests = await query<Test>(
      "select * from tests where child_id = $1 order by test_date desc limit 8",
      [childId]
    );
    const wrongQuestions = await query<WrongQuestion>(
      `select * from wrong_questions
       where child_id = $1
       order by created_at desc
       limit 30`,
      [childId]
    );
    const weakness = await query<{ unit: string; count: string }>(
      `select coalesce(unit, '未分類') as unit, count(*)::text as count
       from wrong_questions
       where child_id = $1
       group by coalesce(unit, '未分類')
       order by count(*) desc
       limit 8`,
      [childId]
    );

    const plan = await generateDailyPlan({
      child,
      recent_tests: tests.rows,
      wrong_questions_count: wrongQuestions.rowCount,
      recent_wrong_questions: wrongQuestions.rows,
      weakness_units: weakness.rows,
      next_test_date: nextTestDate
    });

    return ok({ plan });
  } catch (error) {
    return serverError(error);
  }
}
