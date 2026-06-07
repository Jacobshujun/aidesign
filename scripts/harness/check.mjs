import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

execFileSync(process.execPath, [path.join(scriptDir, "init.mjs")], {
  stdio: "inherit"
});

execFileSync(process.execPath, [path.join(scriptDir, "handoff.mjs")], {
  stdio: "inherit"
});

execFileSync(npmCommand, ["run", "build"], {
  cwd: root,
  stdio: "inherit"
});

console.log("Harness baseline check passed.");
