import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * 프로젝트 최초 감지 레지스트리 — 캐릭터는 "처음 손댄 순간"의 누적 사용량을
 * 0점(기준선)으로 삼고, 그 이후 증가분만 XP로 먹는다.
 *
 * 저장: ~/.claude/tokenmon/projects.json
 *   { "<프로젝트명>": { "firstSeenAt": ISO, "baselineTokens": number } }
 * 파일을 지우면 모든 캐릭터가 그 순간부터 Lv.1로 다시 시작한다.
 */

const DIR = join(homedir(), ".claude", "tokenmon");
const FILE = join(DIR, "projects.json");

interface ProjectRecord {
  firstSeenAt: string;
  baselineTokens: number;
}

function load(): Record<string, ProjectRecord> {
  try {
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Record<string, Partial<ProjectRecord>>;
    const out: Record<string, ProjectRecord> = {};
    for (const [name, record] of Object.entries(parsed)) {
      if (record && typeof record.firstSeenAt === "string" && typeof record.baselineTokens === "number") {
        out[name] = { firstSeenAt: record.firstSeenAt, baselineTokens: record.baselineTokens };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * 새로 감지된 프로젝트를 현재 누적치로 등록하고,
 * 파생 계산에 쓸 { 프로젝트명: 기준선 토큰 } 맵을 돌려준다.
 */
export function syncProjectRegistry(pets: { projectName: string; totalTokens: number }[]): Record<string, number> {
  const registry = load();
  let dirty = false;
  for (const pet of pets) {
    if (!registry[pet.projectName]) {
      registry[pet.projectName] = { firstSeenAt: new Date().toISOString(), baselineTokens: pet.totalTokens };
      dirty = true;
    }
  }
  if (dirty) {
    try {
      mkdirSync(DIR, { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      writeFileSync(tmp, JSON.stringify(registry, null, 2));
      try {
        renameSync(tmp, FILE);
      } catch {
        writeFileSync(FILE, JSON.stringify(registry, null, 2));
      }
    } catch {
      /* 저장 실패 시 다음 폴링에서 재시도 */
    }
  }
  const baselines: Record<string, number> = {};
  for (const [name, record] of Object.entries(registry)) baselines[name] = record.baselineTokens;
  return baselines;
}
