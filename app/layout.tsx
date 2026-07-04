import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAPIX AI Coach",
  description: "日本中学受験向けAI学習コーチ"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
