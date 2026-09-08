import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { TokenmonPet } from "../lib/tokenmon";
import { CLAUDE_DIR, DATA_DIR, readJson, writeJson } from "../lib/local-data";

interface RecordV2 { firstSeenAt: string; claudeBaseline?: number; codexGrowthAtHatch: number }
interface Registry { version: 2; projects: Record<string, RecordV2> }
const FILE = join(DATA_DIR, "projects.json");

/** Read legacy baselines without changing them. Split name collisions proportionally. */
export function migrateLegacyBaselines(pets: TokenmonPet[], legacy: Record<string, { baselineTokens: number }>) {
  const totals = new Map<string, number>();
  for (const p of pets) totals.set(p.projectName, (totals.get(p.projectName) || 0) + (p.providerTokens?.claude || 0));
  return Object.fromEntries(pets.map(p => {
    const claude = p.providerTokens?.claude || 0;
    const total = totals.get(p.projectName) || 0;
    const old = legacy[p.projectName];
    return [p.projectId || p.projectName, old && total ? Math.max(0, old.baselineTokens) * claude / total : claude];
  }));
}

export function syncProjectRegistry(pets: TokenmonPet[]): Record<string, number> {
  // A malformed existing ledger must never silently reset growth.
  const registry: Registry = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { version: 2, projects: {} };
  if (registry.version !== 2 || !registry.projects) throw new Error("Unsupported Tokenmon project ledger");
  const legacy = readJson<Record<string, { baselineTokens: number; firstSeenAt: string }>>(join(CLAUDE_DIR, "projects.json"), {});
  const migrated = migrateLegacyBaselines(pets, legacy);
  const result: Record<string, number> = {};
  let dirty = false;
  for (const p of pets) {
    const id = p.projectId || p.projectName;
    const claude = p.providerTokens?.claude || 0;
    const codex = p.providerTokens?.codex || 0;
    const growth = p.codexGrowth || 0;
    let record = registry.projects[id];
    if (!record) {
      record = registry.projects[id] = { firstSeenAt: legacy[p.projectName]?.firstSeenAt || new Date().toISOString(), codexGrowthAtHatch: growth };
      if (claude > 0) record.claudeBaseline = migrated[id];
      dirty = true;
    }
    if (record.claudeBaseline === undefined && claude > 0) { record.claudeBaseline = migrated[id]; dirty = true; }
    // Historical Codex sessions discovered later do not produce a sudden XP jump.
    result[id] = (record.claudeBaseline || 0) + codex - Math.max(0, growth - record.codexGrowthAtHatch);
  }
  if (dirty) writeJson(FILE, registry);
  return result;
}
