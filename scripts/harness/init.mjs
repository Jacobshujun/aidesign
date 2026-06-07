import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../..");

const requiredFiles = [
  "AGENTS.md",
  "README.md",
  ".env.example",
  "package.json",
  "package-lock.json",
  "index.html",
  "tsconfig.json",
  "vite.config.ts",
  "src/main.tsx",
  "src/App.tsx",
  "src/api.ts",
  "src/data.ts",
  "src/types.ts",
  "src/styles.css",
  "src/vite-env.d.ts",
  "server/config.mjs",
  "server/http.mjs",
  "server/index.mjs",
  "server/providers/textModel.mjs",
  "server/providers/runningHub.mjs",
  "scripts/dev.mjs",
  "docs/harness/project_brief.md",
  "docs/harness/feature_list.json",
  "docs/harness/progress.md",
  "docs/harness/handoff.md",
  "docs/harness/decisions.md",
  "docs/harness/verification.md",
  "docs/harness/pitfalls.md",
  "docs/harness/architecture_rules.md",
  "scripts/harness/init.ps1",
  "scripts/harness/handoff.ps1",
  "scripts/harness/check.ps1",
  "scripts/harness/init.mjs",
  "scripts/harness/handoff.mjs",
  "scripts/harness/check.mjs",
  "scripts/harness/http_smoke.mjs"
];

const fail = (message) => {
  throw new Error(message);
};

for (const relativePath of requiredFiles) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    fail(`Missing required Harness file: ${relativePath}`);
  }
}

const featurePath = path.join(root, "docs/harness/feature_list.json");
let featureList;
try {
  featureList = JSON.parse(fs.readFileSync(featurePath, "utf8"));
} catch (error) {
  fail(`docs/harness/feature_list.json is not valid JSON: ${error.message}`);
}

const allowedStatuses = [
  "not_started",
  "in_progress",
  "ready_for_review",
  "done",
  "blocked"
];

const configuredStatuses = Array.isArray(featureList.status_values)
  ? featureList.status_values
  : [];

for (const status of allowedStatuses) {
  if (!configuredStatuses.includes(status)) {
    fail(`feature_list.json status_values must include '${status}'`);
  }
}

const features = Array.isArray(featureList.features) ? featureList.features : [];
if (features.length < 1) {
  fail("feature_list.json must include at least one feature.");
}

for (const feature of features) {
  if (!feature.id || typeof feature.id !== "string" || !feature.id.trim()) {
    fail("Every feature must have a non-empty id.");
  }

  if (!feature.title || typeof feature.title !== "string" || !feature.title.trim()) {
    fail(`Feature '${feature.id}' must have a non-empty title.`);
  }

  if (!allowedStatuses.includes(feature.status)) {
    fail(`Feature '${feature.id}' has invalid status '${feature.status}'.`);
  }

  const definitionOfDone = Array.isArray(feature.definition_of_done)
    ? feature.definition_of_done
    : [];
  if (definitionOfDone.length < 1) {
    fail(`Feature '${feature.id}' must have at least one definition_of_done item.`);
  }
}

console.log(`Harness init check passed for ${featureList.project}.`);
