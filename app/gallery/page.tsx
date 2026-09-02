import type { Metadata } from "next";
import Link from "next/link";
import { TokenmonGallery } from "@/components/tokenmon-gallery";
import { detectLang } from "@/components/tokenmon-lang";

export const metadata: Metadata = {
  title: "Tokenmon Dex",
  description: "Every species and growth stage at a glance",
};

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const lang = await detectLang();
  return (
    <main className="tokenmon-standalone">
      <div className="tokenmon-standalone-inner">
        <TokenmonGallery lang={lang} />
        <p className="tm-standalone-foot">
          <Link href="/">{lang === "ko" ? "← 내 토큰몬으로" : "← back to my Tokenmon"}</Link>
        </p>
      </div>
    </main>
  );
}
