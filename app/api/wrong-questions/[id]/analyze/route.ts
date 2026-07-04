import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { analyzeWrongQuestion } from "@/lib/openai";
import { badRequest, ok, serverError } from "@/lib/http";
import type { WrongQuestion } from "@/lib/types";

function fallbackAnalysis(wrongQuestion: WrongQuestion) {
  return {
    unit: wrongQuestion.unit || "未分類",
    difficulty: 3,
    mistake_reason: wrongQuestion.mistake_reason || "要確認",
    explanation_for_parent:
      "AI APIの利用枠不足または設定未完了のため、暫定分析を表示しています。問題の単元と誤因を手動で確認してください。",
    review_advice: "3日後に同じ問題を解き直し、7日後に類題を1題復習してください。",
    next_review_days: 3
  };
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const result = await query<WrongQuestion>(
      `select wq.*
       from wrong_questions wq
       join children c on c.id = wq.child_id
       where wq.id = $1 and c.user_id = $2`,
      [id, user.id]
    );

    const wrongQuestion = result.rows[0];
    if (!wrongQuestion) return badRequest("wrong question not found.");

    let analysis;
    let warning: string | undefined;

    try {
      analysis = await analyzeWrongQuestion({
        subject: wrongQuestion.subject,
        source_name: wrongQuestion.source_name,
        question_no: wrongQuestion.question_no,
        current_unit: wrongQuestion.unit,
        current_mistake_reason: wrongQuestion.mistake_reason,
        image_url: wrongQuestion.image_url
      });
    } catch (error) {
      console.error("AI wrong question analysis failed. Returning fallback analysis.", error);
      analysis = fallbackAnalysis(wrongQuestion);
      warning =
        "AI APIの利用枠不足または設定未完了のため、暫定分析を表示しています。";
    }

    const updateResult = await query<WrongQuestion>(
      `update wrong_questions
       set unit = $2,
           difficulty = $3,
           mistake_reason = $4,
           ai_analysis = $5,
           next_review_date = current_date + ($6::int * interval '1 day')
       where id = $1
       returning *`,
      [
        id,
        analysis.unit,
        analysis.difficulty,
        analysis.mistake_reason,
        analysis,
        analysis.next_review_days
      ]
    );

    return ok({ wrongQuestion: updateResult.rows[0], analysis, warning });
  } catch (error) {
    return serverError(error);
  }
}
