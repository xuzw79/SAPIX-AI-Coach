import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
export const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function aiProvider() {
  const configured = process.env.AI_PROVIDER?.toLowerCase();
  if (configured === "gemini" || configured === "openai") return configured;
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "replace-me") {
    return "gemini";
  }
  return "openai";
}

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

function geminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "replace-me") {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GoogleGenAI({ apiKey });
}

function parseJsonResponse<T>(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const objectStart = candidate.indexOf("{");
    const objectEnd = candidate.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      return JSON.parse(candidate.slice(objectStart, objectEnd + 1)) as T;
    }
    throw new Error(`AI response was not valid JSON: ${candidate.slice(0, 120)}`);
  }
}

async function generateGeminiJson<T>(input: {
  model: string;
  instruction: string;
  payload: unknown;
  schema: Record<string, unknown>;
}) {
  const client = geminiClient();
  const response = await client.models.generateContent({
    model: input.model,
    contents: [
      input.instruction,
      "Return only valid JSON. Do not wrap it in Markdown.",
      "All user-facing Japanese text should be natural and concise.",
      "Input data:",
      JSON.stringify(input.payload)
    ].join("\n\n"),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: input.schema
    }
  });

  if (!response.text) {
    throw new Error("Gemini returned an empty response.");
  }

  return parseJsonResponse<T>(response.text);
}

export async function analyzeWrongQuestion(input: unknown) {
  const instruction =
    "You are a Japanese junior high school entrance exam learning coach, especially familiar with SAPIX. Analyze the wrong question for a parent. Return unit, difficulty, mistake reason, parent explanation, review advice, and next review days as JSON.";

  if (aiProvider() === "gemini") {
    return generateGeminiJson<WrongQuestionAnalysis>({
      model: geminiModel,
      instruction,
      payload: input,
      schema: wrongQuestionSchema
    });
  }

  const response = await openai.responses.create({
    model,
    instructions: instruction,
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
  const instruction =
    "You are an AI learning coach for Japanese junior high school entrance exam families. Based on grade, target schools, deviation scores, wrong questions, weakness units, and next test date, create only today's highest-priority study plan. Avoid adding too much new material. Emphasize weakness review. Return JSON only.";

  if (aiProvider() === "gemini") {
    return generateGeminiJson<DailyPlan>({
      model: geminiModel,
      instruction,
      payload: input,
      schema: dailyPlanSchema
    });
  }

  const response = await openai.responses.create({
    model,
    instructions: instruction,
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
