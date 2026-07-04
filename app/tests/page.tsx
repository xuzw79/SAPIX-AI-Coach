"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/client";
import type { Child, Test } from "@/lib/types";

export default function TestsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState("");
  const [tests, setTests] = useState<Test[]>([]);
  const [form, setForm] = useState({
    test_name: "SAPIX オープン",
    test_date: new Date().toISOString().slice(0, 10),
    subject: "算数",
    score: "",
    deviation_value: "",
    memo: ""
  });

  async function loadChildren() {
    const data = await api<{ children: Child[] }>("/api/children");
    setChildren(data.children);
    if (data.children[0] && !childId) setChildId(data.children[0].id);
  }

  async function loadTests(id: string) {
    if (!id) return;
    const data = await api<{ tests: Test[] }>(`/api/tests?childId=${id}`);
    setTests(data.tests);
  }

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    loadTests(childId);
  }, [childId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api("/api/tests", {
      method: "POST",
      body: JSON.stringify({ ...form, child_id: childId })
    });
    await loadTests(childId);
  }

  const latestDeviation = tests.find((test) => test.deviation_value)?.deviation_value;

  return (
    <RequireAuth>
      <AppShell title="テスト結果" description="Weekly、Monthly、SOの成績を記録します。">
        <div className="grid cols-main">
          <section className="panel">
            <h2>偏差値推移</h2>
            {latestDeviation ? (
              <div className="metric">{Number(latestDeviation).toFixed(1)}</div>
            ) : (
              <p className="muted">偏差値データがまだありません。</p>
            )}
            <table className="table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>テスト</th>
                  <th>科目</th>
                  <th>点数</th>
                  <th>偏差値</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.test_date}</td>
                    <td>{test.test_name}</td>
                    <td>{test.subject}</td>
                    <td>{test.score}</td>
                    <td>{test.deviation_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="panel">
            <h2>成績登録</h2>
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
                <label>テスト名</label>
                <input
                  className="input"
                  value={form.test_name}
                  onChange={(event) => setForm({ ...form, test_name: event.target.value })}
                />
              </div>
              <div className="field">
                <label>日付</label>
                <input
                  className="input"
                  type="date"
                  value={form.test_date}
                  onChange={(event) => setForm({ ...form, test_date: event.target.value })}
                />
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
              <div className="grid cols-2">
                <div className="field">
                  <label>点数</label>
                  <input
                    className="input"
                    value={form.score}
                    onChange={(event) => setForm({ ...form, score: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label>偏差値</label>
                  <input
                    className="input"
                    value={form.deviation_value}
                    onChange={(event) =>
                      setForm({ ...form, deviation_value: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="field">
                <label>メモ</label>
                <textarea
                  className="textarea"
                  value={form.memo}
                  onChange={(event) => setForm({ ...form, memo: event.target.value })}
                />
              </div>
              <button className="button">保存</button>
            </form>
          </section>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
