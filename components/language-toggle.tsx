"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TokenmonLang } from "@/lib/tokenmon";

export function LanguageToggle({ lang }: { lang: TokenmonLang }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  function choose(next: TokenmonLang) {
    document.cookie = `tokenmon-lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    startTransition(() => router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false }));
  }

  return <div className="tm-language-toggle" role="group" aria-label={lang === "ko" ? "화면 언어" : "Display language"} aria-busy={pending}>
    {(["ko", "en"] as const).map(value => <button key={value} type="button" lang={value} aria-pressed={lang === value} disabled={pending} onClick={() => choose(value)}>
      {value === "ko" ? "한국어" : "English"}
    </button>)}
  </div>;
}
