"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function AppShell({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">サ</div>
          <div>
            <strong>SAPIX AI Coach</strong>
            <span>サピAI</span>
          </div>
        </div>
        <nav className="nav">
          <Link href="/dashboard">ダッシュボード</Link>
          <Link href="/children">子供情報</Link>
          <Link href="/tests">成績入力</Link>
          <Link href="/wrong-questions">錯題管理</Link>
          <Link href="/plan">今日の計画</Link>
          <button onClick={logout}>ログアウト</button>
        </nav>
      </aside>
      <main className="main">
        <div className="topbar">
          <div>
            <h1>{title}</h1>
            <p className="lead">{description}</p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
