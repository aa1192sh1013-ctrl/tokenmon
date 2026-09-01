import { readdirSync, readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { mockTokenmonSnapshots } from "@/lib/mock";
import { deriveTokenmonState, parseTokenmonSnapshot, type TokenmonSnapshot } from "@/lib/tokenmon";
import { TokenmonPanel } from "./tokenmon-panel";
import { readActiveTranscriptSnapshots, sanitizeSessionId } from "./transcript-tail";

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
/* 임시 폴더 아래 전부 제외 — 도구들이 만드는 실험용 샌드박스가 목장에 들어오지 않게. */
const ignoreProjectDirPrefixes = [tmpdir()];

/** ~/.claude/tokenmon/config.json 의 { "ignoreProjects": ["_*", ...] } — 사용자 커스텀 제외 패턴. */
function readIgnoreProjectNames(): string[] {
  try {
    const config = JSON.parse(readFileSync(join(homedir(), ".claude", "tokenmon", "config.json"), "utf8")) as {
      ignoreProjects?: unknown;
    };
    return Array.isArray(config.ignoreProjects) ? config.ignoreProjects.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function TokenmonSection() {
  const persisted = readSnapshots();
  // statusline 수집기가 담당 중인 세션은 테일링에서 제외 (statusline 쪽 데이터가 더 풍부)
  const statuslineIds = new Set(
    persisted
      .map((snapshot) => snapshot.payload.session_id ?? "")
      .filter((id) => id !== "" && !id.startsWith("backfill-") && !id.startsWith("transcript-"))
      .map(sanitizeSessionId),
  );
  const tailed = await readActiveTranscriptSnapshots(statuslineIds);
  const tailedIds = new Set(tailed.map((snapshot) => snapshot.payload.session_id));
  const real = [...persisted.filter((snapshot) => !tailedIds.has(snapshot.payload.session_id)), ...tailed];
  const live = real.length > 0;
  const state = deriveTokenmonState(live ? real : mockTokenmonSnapshots(), {
    live,
    ignoreProjectDirs,
    ignoreProjectDirPrefixes,
    ignoreProjectNames: readIgnoreProjectNames(),
  });
  return <TokenmonPanel state={state} />;
}
