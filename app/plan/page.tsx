"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/client";
import type { Child } from "@/lib/types";

type PlanItem = {
  subject: string;
  unit: string;
  minutes: number;
  reason: string;
};

export default function PlanPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState("");
  const [nextTestDate, setNextTestDate] = useState("");
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(false);
  const total = plan.reduce((sum, item) => sum + item.minutes, 0);

  useEffect(() => {
    api<{ children: Child[] }>("/api/children").then((data) => {
      setChildren(data.children);
      if (data.children[0]) setChildId(data.children[0].id);
    });
  }, []);

  async function generate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api<{ plan: { today_plan: PlanItem[] } }>("/api/plan", {
        method: "POST",
        body: JSON.stringify({
          child_id: childId,
          next_test_date: nextTestDate || null
        })
      });
      setPlan(data.plan.today_plan);
    } finally {
      setLoading(false);
    }
  }

  return (
    <RequireAuth>
      <AppShell
        title="AI每日学習計画"
        description="成績・錯題・弱点・志望校から、今日やるべき内容を生成します。"
      >
        <div className="grid cols-main">
          <section className="panel">
            <h2>今日やること</h2>
            {plan.length === 0 ? (
              <p className="muted">子供と次回テスト日を選び、計画を生成してください。</p>
            ) : (
              <>
                <div className="metric">{total}分</div>
                {plan.map((item, index) => (
                  <div className="row" key={`${item.subject}-${item.unit}-${index}`}>
                    <div>
                      <strong>
                        {item.subject} / {item.unit}
                      </strong>
                      <div className="small muted">{item.reason}</div>
                    </div>
                    <span className="tag">{item.minutes}分</span>
                  </div>
                ))}
              </>
            )}
          </section>
          <section className="panel">
            <h2>生成条件</h2>
            <form className="form" onSubmit={generate}>
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
                <label>次回テスト日</label>
                <input
                  className="input"
                  type="date"
                  value={nextTestDate}
                  onChange={(event) => setNextTestDate(event.target.value)}
                />
              </div>
              <button className="button" disabled={loading}>
                {loading ? "生成中..." : "AI学習計画を生成"}
              </button>
            </form>
          </section>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
