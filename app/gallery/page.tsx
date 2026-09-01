import type { Metadata } from "next";
import Link from "next/link";
import { TokenmonGallery } from "@/components/tokenmon-gallery";

export const metadata: Metadata = {
  title: "Tokenmon 도감",
  description: "모든 종족과 성장 단계 미리보기",
};

export default function GalleryPage() {
  return (
    <main className="tokenmon-standalone">
      <div className="tokenmon-standalone-inner">
        <TokenmonGallery />
        <p className="tm-standalone-foot">
          <Link href="/">← 내 토큰몬으로</Link>
        </p>
      </div>
    </main>
  );
}
