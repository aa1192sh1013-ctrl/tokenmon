import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tokenmon",
  description: "Claude Code 토큰 다마고치 — 실시간 사용량과 함께 자라는 픽셀 펫",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
