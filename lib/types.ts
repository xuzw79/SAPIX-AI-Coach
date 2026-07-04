export type Child = {
  id: string;
  user_id: string;
  name: string;
  grade: string;
  school_type: string;
  target_schools: string[];
};

export type Test = {
  id: string;
  child_id: string;
  test_name: string;
  test_date: string;
  subject: string;
  score: string | null;
  deviation_value: string | null;
  memo: string | null;
};

export type WrongQuestion = {
  id: string;
  child_id: string;
  subject: string;
  source_name: string;
  question_no: string;
  image_url: string | null;
  unit: string | null;
  difficulty: number | null;
  mistake_reason: string | null;
  ai_analysis: Record<string, unknown> | null;
  review_status: string;
  next_review_date: string | null;
  created_at: string;
};
