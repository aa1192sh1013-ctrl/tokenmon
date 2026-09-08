import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tokenmon",
  description: "Claude Code와 Codex 사용량으로 키우는 AnimalBot 동물봇",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
