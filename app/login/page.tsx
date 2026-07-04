"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/api/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました。");
    }
  }

  return (
    <div className="auth-page">
      <div className="panel auth-card">
        <div className="brand">
          <div className="brand-mark">サ</div>
          <div>
            <strong>SAPIX AI Coach</strong>
            <span>日本中学受験向けAI学習コーチ</span>
          </div>
        </div>
        <h1>{mode === "login" ? "ログイン" : "新規登録"}</h1>
        <p className="lead">保護者用のメールアドレスでログインしてください。</p>
        <form className="form" onSubmit={submit}>
          {error ? <div className="error">{error}</div> : null}
          <div className="field">
            <label>メールアドレス</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>パスワード</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>
          <button className="button" type="submit">
            {mode === "login" ? "ログイン" : "登録して開始"}
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "新規登録へ" : "ログインへ"}
          </button>
        </form>
      </div>
    </div>
  );
}
