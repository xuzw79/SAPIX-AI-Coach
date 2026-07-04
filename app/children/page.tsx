"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/client";
import type { Child } from "@/lib/types";

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    grade: "小5",
    school_type: "SAPIX",
    target_schools: "本郷"
  });

  async function load() {
    const data = await api<{ children: Child[] }>("/api/children");
    setChildren(data.children);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    await api("/api/children", {
      method: "POST",
      body: JSON.stringify(form)
    });
    setMessage("子供情報を登録しました。");
    setForm({ ...form, name: "" });
    await load();
  }

  return (
    <RequireAuth>
      <AppShell title="子供情報" description="学年、塾、志望校を登録します。">
        <div className="grid cols-main">
          <section className="panel">
            <h2>登録済み</h2>
            {children.length === 0 ? <p className="muted">まだ登録がありません。</p> : null}
            {children.map((child) => (
              <div className="row" key={child.id}>
                <div>
                  <strong>{child.name}</strong>
                  <div className="small muted">
                    {child.grade} / {child.school_type} / 志望校:{" "}
                    {child.target_schools.join("、") || "未設定"}
                  </div>
                </div>
                <span className="tag">ID登録済</span>
              </div>
            ))}
          </section>
          <section className="panel">
            <h2>新規登録</h2>
            <form className="form" onSubmit={submit}>
              {message ? <div className="success">{message}</div> : null}
              <div className="field">
                <label>名前</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>学年</label>
                <select
                  className="select"
                  value={form.grade}
                  onChange={(event) => setForm({ ...form, grade: event.target.value })}
                >
                  <option>小4</option>
                  <option>小5</option>
                  <option>小6</option>
                </select>
              </div>
              <div className="field">
                <label>塾</label>
                <select
                  className="select"
                  value={form.school_type}
                  onChange={(event) =>
                    setForm({ ...form, school_type: event.target.value })
                  }
                >
                  <option>SAPIX</option>
                  <option>四谷大塚</option>
                  <option>早稲田アカデミー</option>
                  <option>日能研</option>
                </select>
              </div>
              <div className="field">
                <label>志望校（カンマ区切り）</label>
                <input
                  className="input"
                  value={form.target_schools}
                  onChange={(event) =>
                    setForm({ ...form, target_schools: event.target.value })
                  }
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
