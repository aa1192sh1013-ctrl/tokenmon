import { existsSync, readFileSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

export function normalizeProjectPath(value: string): string {
  const clean = value.replace(/\\/g, "/").replace(/\/+$/, "");
  return /^[a-z]:/i.test(clean) || clean.startsWith("//") ? clean.toLowerCase() : clean;
}

/** Resolve Git worktrees through their common .git directory, without running Git. */
export function projectIdentity(cwd: string, aliases: Record<string, string> = {}) {
  let root = cwd;
  try { root = realpathSync(cwd); } catch { /* Retain unavailable/archived paths. */ }
  let cursor = root;
  if (isAbsolute(cursor)) {
    while (true) {
      const git = join(cursor, ".git");
      if (existsSync(git)) {
        root = cursor;
        try {
          const match = readFileSync(git, "utf8").trim().match(/^gitdir:\s*(.+)$/);
          if (match) {
            const gitDir = resolve(cursor, match[1]);
            const common = resolve(gitDir, readFileSync(join(gitDir, "commondir"), "utf8").trim());
            if (basename(common) === ".git") root = dirname(common);
          }
        } catch { /* Normal .git directory or non-worktree checkout. */ }
        break;
      }
      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }
  const alias = Object.entries(aliases).find(([from]) => normalizeProjectPath(from) === normalizeProjectPath(root));
  if (alias) root = alias[1];
  const id = normalizeProjectPath(root || "unknown-project");
  return { id, name: root.replace(/\\/g, "/").split("/").filter(Boolean).pop() || "unknown-project" };
}
