"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/client";
import type { Child, WrongQuestion } from "@/lib/types";

export default function WrongQuestionsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState("");
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [analyzingId, setAnalyzingId] = useState("");
  const [form, setForm] = useState({
    subject: "算数",
    source_name: "Weekly 第18回",
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
    setWrongQuestions(data.wrongQuestions);
  }

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    loadWrongQuestions(childId);
  }, [childId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api("/api/wrong-questions", {
      method: "POST",
      body: JSON.stringify({ ...form, child_id: childId })
    });
    setForm({ ...form, question_no: "", image_url: "", mistake_reason: "" });
    await loadWrongQuestions(childId);
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
        title="錯題管理"
        description="錯題を登録し、AIで単元・誤因・復習日を分析します。"
      >
        <div className="grid cols-main">
          <section className="panel">
            <h2>錯題一覧</h2>
            {wrongQuestions.length === 0 ? (
              <p className="muted">まだ錯題がありません。</p>
            ) : null}
            {wrongQuestions.map((question) => {
              const analysis = question.ai_analysis as
                | {
                    explanation_for_parent?: string;
                    review_advice?: string;
                  }
                | null;
              return (
                <div className="row" key={question.id}>
                  <div>
                    <strong>
                      {question.subject} / {question.source_name} / {question.question_no}
                    </strong>
                    <div className="small muted">
                      単元: {question.unit || "未分類"} / 難度:{" "}
                      {question.difficulty || "-"} / 誤因:{" "}
                      {question.mistake_reason || "未分析"}
                    </div>
                    {analysis?.explanation_for_parent ? (
                      <p className="small">{analysis.explanation_for_parent}</p>
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
                </div>
              );
            })}
          </section>

          <section className="panel">
            <h2>錯題登録</h2>
            <form className="form" onSubmit={submit}>
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
                  onChange={(event) => setForm({ ...form, subject: event.target.value })}
                >
                  <option>算数</option>
                  <option>国語</option>
                  <option>理科</option>
                  <option>社会</option>
                </select>
              </div>
              <div className="field">
                <label>教材・テスト名</label>
                <input
                  className="input"
                  value={form.source_name}
                  onChange={(event) =>
                    setForm({ ...form, source_name: event.target.value })
                  }
                />
              </div>
              <div className="field">
                <label>問題番号</label>
                <input
                  className="input"
                  value={form.question_no}
                  onChange={(event) =>
                    setForm({ ...form, question_no: event.target.value })
                  }
                  required
                />
              </div>
              <div className="field">
                <label>画像URL（任意）</label>
                <input
                  className="input"
                  value={form.image_url}
                  onChange={(event) => setForm({ ...form, image_url: event.target.value })}
                />
              </div>
              <div className="grid cols-2">
                <div className="field">
                  <label>単元（任意）</label>
                  <input
                    className="input"
                    value={form.unit}
                    onChange={(event) => setForm({ ...form, unit: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label>誤因メモ（任意）</label>
                  <input
                    className="input"
                    value={form.mistake_reason}
                    onChange={(event) =>
                      setForm({ ...form, mistake_reason: event.target.value })
                    }
                  />
                </div>
              </div>
              <button className="button">保存</button>
            </form>
          </section>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
