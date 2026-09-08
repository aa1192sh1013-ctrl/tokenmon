import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("../", import.meta.url));
const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 20 || (major === 20 && minor < 9)) {
  console.error("Node.js 20.9 이상이 필요합니다. https://nodejs.org/ 에서 설치하세요.");
  process.exit(1);
}

function npm(args) {
  const result = spawnSync("npm", args, {
    cwd: root,
    stdio: "inherit",
    // Windows npm is a .cmd shim. Arguments here are fixed, never user input.
    shell: process.platform === "win32",
    windowsHide: true,
  });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}

if (!existsSync(join(root, "node_modules", "next", "package.json"))) {
  console.log("첫 실행 준비: 필요한 구성 요소를 내려받습니다. 인터넷 연결이 필요합니다.");
  npm(["ci"]);
}
if (!existsSync(join(root, ".next", "BUILD_ID"))) {
  console.log("Tokenmon을 준비합니다. 처음에는 몇 분 걸릴 수 있습니다.");
  npm(["run", "build"]);
}
console.log("\n브라우저에서 http://127.0.0.1:4242/?lang=ko 를 여세요.");
console.log("사용하는 동안 이 창을 열어 두세요. 종료: Ctrl+C\n");
npm(["start"]);
