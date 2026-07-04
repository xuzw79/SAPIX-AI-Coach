"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/client";
import type { Child, Test, WrongQuestion } from "@/lib/types";

export default function DashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState("");
  const [tests, setTests] = useState<Test[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);

  useEffect(() => {
    api<{ children: Child[] }>("/api/children").then((data) => {
      setChildren(data.children);
      if (data.children[0]) setChildId(data.children[0].id);
    });
  }, []);

  useEffect(() => {
    if (!childId) return;
    api<{ tests: Test[] }>(`/api/tests?childId=${childId}`).then((data) =>
      setTests(data.tests)
    );
    api<{ wrongQuestions: WrongQuestion[] }>(
      `/api/wrong-questions?childId=${childId}`
    ).then((data) => setWrongQuestions(data.wrongQuestions));
  }, [childId]);

  const weakness = useMemo(() => {
    const counts = new Map<string, number>();
    wrongQuestions.forEach((question) => {
      const unit = question.unit || "未分類";
      counts.set(unit, (counts.get(unit) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([unit, count]) => ({ unit, count }));
  }, [wrongQuestions]);

  const latestDeviation = tests.find((test) => test.deviation_value)?.deviation_value;
  const nextReview = wrongQuestions
    .filter((question) => question.next_review_date)
    .slice(0, 3);

  return (
    <RequireAuth>
      <AppShell
        title="今日、何を勉強すべきか"
        description="偏差値、錯題、弱点、志望校から次の一手を見ます。"
      >
        {children.length === 0 ? (
          <section className="panel">
            <h2>最初に子供情報を登録してください</h2>
            <p className="lead">
              子供情報を作成すると、成績・錯題・AI学習計画が使えるようになります。
            </p>
            <p>
              <Link className="button" href="/children">
                子供情報を登録
              </Link>
            </p>
          </section>
        ) : (
          <div className="grid">
            <section className="panel">
              <div className="field">
                <label>表示する子供</label>
                <select
                  className="select"
                  value={childId}
                  onChange={(event) => setChildId(event.target.value)}
                >
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name} / {child.grade}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <div className="grid cols-3">
              <section className="panel">
                <h2>最近の偏差値</h2>
                <div className="metric">{latestDeviation || "-"}</div>
                <p className="small muted">テスト結果を登録すると推移を確認できます。</p>
              </section>
              <section className="panel">
                <h2>錯題数</h2>
                <div className="metric">{wrongQuestions.length}</div>
                <p className="small muted">AI分析済み錯題を増やすほど精度が上がります。</p>
              </section>
              <section className="panel">
                <h2>今日やること</h2>
                <p className="small muted">AI計画画面で今日の学習パスを生成します。</p>
                <Link className="button secondary" href="/plan">
                  計画生成へ
                </Link>
              </section>
            </div>

            <div className="grid cols-main">
              <section className="panel">
                <h2>弱点ランキング</h2>
                <div className="bars">
                  {weakness.length === 0 ? (
                    <p className="muted">錯題分析後に表示されます。</p>
                  ) : null}
                  {weakness.map((item) => {
                    const width = Math.min(100, item.count * 18);
                    return (
                      <div className="bar-row" key={item.unit}>
                        <strong>{item.unit}</strong>
                        <div className={`bar ${item.count >= 3 ? "bad" : "warn"}`}>
                          <span style={{ width: `${width}%` }} />
                        </div>
                        <span>{item.count}題</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="panel">
                <h2>次に復習する錯題</h2>
                {nextReview.length === 0 ? (
                  <p className="muted">AI分析を実行すると復習日が入ります。</p>
                ) : null}
                {nextReview.map((question) => (
                  <div className="row" key={question.id}>
                    <div>
                      <strong>{question.unit || question.subject}</strong>
                      <div className="small muted">
                        {question.source_name} / {question.question_no}
                      </div>
                    </div>
                    <span className="tag">{question.next_review_date}</span>
                  </div>
                ))}
              </section>
            </div>
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}
