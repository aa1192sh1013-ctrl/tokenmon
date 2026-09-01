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

export function TokenmonSection() {
  const real = readSnapshots();
  const live = real.length > 0;
  const state = deriveTokenmonState(live ? real : mockTokenmonSnapshots(), { live });
  return <TokenmonPanel state={state} />;
}
