import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { generateDailyPlan } from "@/lib/openai";
import { badRequest, ok, requiredString, serverError } from "@/lib/http";
import type { Child, Test, WrongQuestion } from "@/lib/types";

function fallbackPlan(input: {
  weakness: Array<{ unit: string; count: string }>;
  wrongQuestions: WrongQuestion[];
  tests: Test[];
}) {
  const topWeakness = input.weakness
    .filter((item) => item.unit !== "未分類")
    .slice(0, 3);
  const recentSubjects = input.wrongQuestions.reduce<Record<string, number>>(
    (memo, question) => {
      memo[question.subject] = (memo[question.subject] || 0) + 1;
      return memo;
    },
    {}
  );
  const mainSubject =
    Object.entries(recentSubjects).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "算数";

  const items = topWeakness.map((item, index) => ({
    subject:
      input.wrongQuestions.find((question) => question.unit === item.unit)
        ?.subject || mainSubject,
    unit: item.unit,
    minutes: index === 0 ? 40 : 20,
    reason: `AI APIの利用枠不足のため、錯題数に基づく暫定計画です。最近の錯題が${item.count}題あります。`
  }));

  if (items.length === 0) {
    items.push({
      subject: mainSubject,
      unit: "錯題復習",
      minutes: 40,
      reason:
        "AI APIの利用枠不足のため、暫定計画です。直近の錯題を優先して復習してください。"
    });
  }

  return { today_plan: items };
}

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

    const planInput = {
      child,
      recent_tests: tests.rows,
      wrong_questions_count: wrongQuestions.rowCount,
      recent_wrong_questions: wrongQuestions.rows,
      weakness_units: weakness.rows,
      next_test_date: nextTestDate
    };

    try {
      const plan = await generateDailyPlan(planInput);
      return ok({ plan });
    } catch (error) {
      console.error("OpenAI plan generation failed. Returning fallback plan.", error);
      return ok({
        plan: fallbackPlan({
          weakness: weakness.rows,
          wrongQuestions: wrongQuestions.rows,
          tests: tests.rows
        }),
        warning:
          "OpenAI APIの利用枠不足または一時的なエラーのため、暫定計画を表示しています。"
      });
    }
  } catch (error) {
    return serverError(error);
  }
}
