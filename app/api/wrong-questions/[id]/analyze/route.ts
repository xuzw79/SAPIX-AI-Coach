import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { analyzeWrongQuestion } from "@/lib/openai";
import { badRequest, ok, serverError } from "@/lib/http";
import type { WrongQuestion } from "@/lib/types";

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

    const analysis = await analyzeWrongQuestion({
      subject: wrongQuestion.subject,
      source_name: wrongQuestion.source_name,
      question_no: wrongQuestion.question_no,
      current_unit: wrongQuestion.unit,
      current_mistake_reason: wrongQuestion.mistake_reason,
      image_url: wrongQuestion.image_url
    });

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

    return ok({ wrongQuestion: updateResult.rows[0], analysis });
  } catch (error) {
    return serverError(error);
  }
}
