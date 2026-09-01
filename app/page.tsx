import { TokenmonSection } from "@/components/tokenmon-section";

/* 매 요청마다 ~/.claude/tokenmon의 최신 스냅샷을 다시 읽어야 한다. */
export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="tokenmon-standalone">
      <div className="tokenmon-standalone-inner">
        <TokenmonSection />
      </div>
    </main>
  );
}
