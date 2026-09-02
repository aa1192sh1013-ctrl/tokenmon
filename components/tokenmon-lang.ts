import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { headers } from "next/headers";
import type { TokenmonLang } from "@/lib/tokenmon";

/**
 * UI 언어 결정 — 영어 기본.
 * 0) URL의 ?lang=ko|en (미리보기·스크린샷용)
 * 1) ~/.claude/tokenmon/config.json 의 { "lang": "ko" | "en" }
 * 2) 브라우저 Accept-Language 에 한국어가 있으면 한국어
 */
export async function detectLang(override?: unknown): Promise<TokenmonLang> {
  if (override === "ko" || override === "en") return override;
  try {
    const config = JSON.parse(readFileSync(join(homedir(), ".claude", "tokenmon", "config.json"), "utf8")) as {
      lang?: unknown;
    };
    if (config.lang === "ko" || config.lang === "en") return config.lang;
  } catch {
    /* 설정 없음 */
  }
  try {
    const accept = ((await headers()).get("accept-language") ?? "").toLowerCase();
    if (accept.includes("ko")) return "ko";
  } catch {
    /* 헤더를 못 읽는 컨텍스트면 영어 */
  }
  return "en";
}
