"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/client";
import type { Child, WrongQuestion } from "@/lib/types";

type WrongQuestionAnalysis = {
  explanation_for_parent?: string;
  review_advice?: string;
};

const maxImageBytes = 4 * 1024 * 1024;

export default function WrongQuestions({ subject }: { subject?: string }) {
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState("");
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [analyzingId, setAnalyzingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    subject: subject || "算数",
    source_name: "",
    question_no: "",
    image_url: "",
    unit: "",
    mistake_reason: ""
  });

  async function loadChildren() {
    const data = await api<{ children: Child[] }>("/api/children");
    setChildren(data.children);
    if (data.children[0] && !childId) setChildId(data.children[0].id);
  }

  async function loadWrongQuestions(id: string) {
    if (!id) return;
    const data = await api<{ wrongQuestions: WrongQuestion[] }>(
      `/api/wrong-questions?childId=${id}`
    );
    setWrongQuestions(subject
      ? data.wrongQuestions.filter((question) => question.subject === subject)
      : data.wrongQuestions);
  }

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    loadWrongQuestions(childId);
  }, [childId, subject]);

  async function onImageSelected(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    if (file.size > maxImageBytes) {
      setError("画像は4MB以下にしてください。");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setForm((current) => ({ ...current, image_url: dataUrl }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!form.image_url) {
      setError("錯題の写真を選択してください。");
      return;
    }

    const data = await api<{ wrongQuestion: WrongQuestion }>("/api/wrong-questions", {
      method: "POST",
      body: JSON.stringify({ ...form, child_id: childId })
    });
    setMessage("写真を保存しました。AI分析ボタンで単元と復習方針を生成できます。");
    setForm({
      subject: form.subject,
      source_name: "",
      question_no: "",
      image_url: "",
      unit: "",
      mistake_reason: ""
    });
    await loadWrongQuestions(childId);

    if (data.wrongQuestion?.id) {
      await analyze(data.wrongQuestion.id);
    }
  }

  async function analyze(id: string) {
    setAnalyzingId(id);
    try {
      await api(`/api/wrong-questions/${id}/analyze`, { method: "POST" });
      await loadWrongQuestions(childId);
    } finally {
      setAnalyzingId("");
    }
  }

  return (
    <RequireAuth>
      <AppShell
        title={subject ? `${subject}の錯題写真` : "錯題アップロード"}
        description={subject ? `${subject}の写真・単元・分析・復習内容` : "錯題を写真で登録し、AIが単元・誤因・復習日を分析します。"}
      >
        <div className="grid cols-main">
          <section className="panel">
            <h2>{subject || "全科目"}の写真一覧 <span className="muted small">{wrongQuestions.length}件</span></h2>
            <div className="field subject-child-selector">
              <label htmlFor="list-child">子供</label>
              <select id="list-child" className="select" value={childId}
                onChange={(event) => { setWrongQuestions([]); setChildId(event.target.value); }}>
                {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
              </select>
            </div>
            {wrongQuestions.length === 0 ? (
              <p className="muted">まだ錯題がありません。</p>
            ) : null}
            {wrongQuestions.map((question) => {
              const analysis = question.ai_analysis as WrongQuestionAnalysis | null;
              return (
                <article className="question-photo" key={question.id}>
                  <div>
                    <strong>
                      {question.subject} / {question.source_name} / {question.question_no}
                    </strong>
                    {question.image_url ? (
                      <img
                        alt="錯題写真"
                        src={question.image_url}
                        className="question-photo-image"
                      />
                    ) : <p className="muted small">写真未登録</p>}
                    <dl className="question-photo-facts small">
                      <dt>単元</dt><dd>{question.unit || "未分類"}</dd>
                      <dt>難度</dt><dd>{question.difficulty ? `${question.difficulty} / 5` : "未分析"}</dd>
                      <dt>間違いの原因</dt><dd>{question.mistake_reason || "未分析"}</dd>
                      <dt>復習状況</dt><dd>{question.review_status}</dd>
                    </dl>
                    {analysis?.explanation_for_parent ? (
                      <div className="small"><h3>内容・分析</h3><p>{analysis.explanation_for_parent}</p></div>
                    ) : null}
                    {analysis?.review_advice ? (
                      <p className="small muted">復習助言: {analysis.review_advice}</p>
                    ) : null}
                    {question.next_review_date ? (
                      <span className="tag">次回復習: {question.next_review_date}</span>
                    ) : null}
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => analyze(question.id)}
                    disabled={analyzingId === question.id}
                  >
                    {analyzingId === question.id ? "分析中..." : "AI分析"}
                  </button>
                </article>
              );
            })}
          </section>

          <section className="panel">
            <h2>写真で登録</h2>
            <form className="form" onSubmit={submit}>
              {message ? <div className="success">{message}</div> : null}
              {error ? <div className="error">{error}</div> : null}
              <div className="field">
                <label>子供</label>
                <select
                  className="select"
                  value={childId}
                  onChange={(event) => setChildId(event.target.value)}
                  required
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>科目</label>
                <select
                  className="select"
                  value={form.subject}
                  disabled={Boolean(subject)}
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                >
                  <option>算数</option>
                  <option>国語</option>
                  <option>理科</option>
                  <option>社会</option>
                </select>
              </div>
              <div className="field">
                <label>錯題写真</label>
                <input
                  className="input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => onImageSelected(event.target.files?.[0])}
                  required
                />
              </div>
              {form.image_url ? (
                <img
                  alt="アップロード予定の錯題"
                  src={form.image_url}
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid var(--line)"
                  }}
                />
              ) : null}
              <div className="field">
                <label>教材・テスト名（任意）</label>
                <input
                  className="input"
                  placeholder="例: Weekly 第18回"
                  value={form.source_name}
                  onChange={(event) =>
                    setForm({ ...form, source_name: event.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>問題番号（任意）</label>
                <input
                  className="input"
                  placeholder="例: 23"
                  value={form.question_no}
                  onChange={(event) =>
                    setForm({ ...form, question_no: event.target.value })
                  }
                />
              </div>
              <div className="grid cols-2">
                <div className="field">
                  <label>単元メモ（任意）</label>
                  <input
                    className="input"
                    placeholder="例: 割合"
                    value={form.unit}
                    onChange={(event) => setForm({ ...form, unit: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label>誤因メモ（任意）</label>
                  <input
                    className="input"
                    placeholder="例: もとにする量を逆にした"
                    value={form.mistake_reason}
                    onChange={(event) =>
                      setForm({ ...form, mistake_reason: event.target.value })
                    }
                  />
                </div>
              </div>
              <button className="button" disabled={!childId || analyzingId !== ""}>
                保存してAI分析
              </button>
            </form>
          </section>
        </div>
      </AppShell>
    </RequireAuth>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
