"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        setReady(true);
      });
  }, [router]);

  if (!ready) {
    return (
      <div className="auth-page">
        <div className="panel">読み込み中...</div>
      </div>
    );
  }

  return children;
}
