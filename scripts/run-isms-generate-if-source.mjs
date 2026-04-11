import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const sourcePath = path.join(repoRoot, "ISO27001-CISO-Command-Suite .html");

if (!fs.existsSync(sourcePath)) {
  console.log("Skipped ISMS generation: source HTML not found.");
  process.exit(0);
}

const scripts = ["isms:generate:constants", "isms:generate:routes"];

for (const scriptName of scripts) {
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("ISMS generation completed from source HTML.");
