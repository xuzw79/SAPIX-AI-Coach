import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

export type WrongQuestionAnalysis = {
  unit: string;
  difficulty: number;
  mistake_reason: string;
  explanation_for_parent: string;
  review_advice: string;
  next_review_days: number;
};

export type DailyPlan = {
  today_plan: Array<{
    subject: string;
    unit: string;
    minutes: number;
    reason: string;
  }>;
};

const wrongQuestionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "unit",
    "difficulty",
    "mistake_reason",
    "explanation_for_parent",
    "review_advice",
    "next_review_days"
  ],
  properties: {
    unit: { type: "string" },
    difficulty: { type: "integer", minimum: 1, maximum: 5 },
    mistake_reason: { type: "string" },
    explanation_for_parent: { type: "string" },
    review_advice: { type: "string" },
    next_review_days: { type: "integer", minimum: 1, maximum: 30 }
  }
};

const dailyPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["today_plan"],
  properties: {
    today_plan: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["subject", "unit", "minutes", "reason"],
        properties: {
          subject: { type: "string" },
          unit: { type: "string" },
          minutes: { type: "integer", minimum: 10, maximum: 90 },
          reason: { type: "string" }
        }
      }
    }
  }
};

export async function analyzeWrongQuestion(input: unknown) {
  const response = await openai.responses.create({
    model,
    instructions:
      "あなたは日本の中学受験、特にSAPIXに詳しい学習コーチです。保護者向けに、錯題の単元、難度、誤因、復習助言を短く具体的に分析してください。出力は必ず指定JSONにしてください。",
    input: JSON.stringify(input),
    text: {
      format: {
        type: "json_schema",
        name: "wrong_question_analysis",
        strict: true,
        schema: wrongQuestionSchema
      }
    },
    store: false
  });

  return JSON.parse(response.output_text) as WrongQuestionAnalysis;
}

export async function generateDailyPlan(input: unknown) {
  const response = await openai.responses.create({
    model,
    instructions:
      "あなたは日本の中学受験家庭向けAI学習コーチです。子供の学年、志望校、偏差値、錯題、弱点、次回テスト日から、今日やるべき学習だけを優先順位順に作ってください。新しい教材を増やしすぎず、弱点復習を重視してください。出力は必ず指定JSONにしてください。",
    input: JSON.stringify(input),
    text: {
      format: {
        type: "json_schema",
        name: "daily_learning_plan",
        strict: true,
        schema: dailyPlanSchema
      }
    },
    store: false
  });

  return JSON.parse(response.output_text) as DailyPlan;
}
