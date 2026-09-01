import { readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { mockTokenmonSnapshots } from "@/lib/mock";
import { deriveTokenmonState, parseTokenmonSnapshot, type TokenmonSnapshot } from "@/lib/tokenmon";
import { TokenmonPanel } from "./tokenmon-panel";

const sessionsDir = join(homedir(), ".claude", "tokenmon", "sessions");

function readSnapshots(): TokenmonSnapshot[] {
  try {
    return readdirSync(sessionsDir)
      .filter((name) => name.endsWith(".json"))
      .map((name) => {
        try {
          return parseTokenmonSnapshot(readFileSync(join(sessionsDir, name), "utf8"));
        } catch {
          return null;
        }
      })
      .filter((snapshot): snapshot is TokenmonSnapshot => snapshot !== null);
  } catch {
    return [];
  }
}

/* 프로젝트가 아닌 "그냥 연 곳"들 — 여기서 시작한 세션은 캐릭터를 만들지 않는다. */
const ignoreProjectDirs = [homedir(), join(homedir(), "Desktop"), join(homedir(), "Downloads"), join(homedir(), "Documents")];

export function TokenmonSection() {
  const real = readSnapshots();
  const live = real.length > 0;
  const state = deriveTokenmonState(live ? real : mockTokenmonSnapshots(), { live, ignoreProjectDirs });
  return <TokenmonPanel state={state} />;
}
