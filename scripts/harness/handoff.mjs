import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../..");

const requiredFiles = [
  "docs/harness/handoff.md",
  "docs/harness/progress.md",
  "docs/harness/feature_list.json"
];

const fail = (message) => {
  throw new Error(message);
};

for (const relativePath of requiredFiles) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    fail(`Missing handoff file: ${relativePath}`);
  }
}

const featurePath = path.join(root, "docs/harness/feature_list.json");
let featureList;
try {
  featureList = JSON.parse(fs.readFileSync(featurePath, "utf8"));
} catch (error) {
  fail(`docs/harness/feature_list.json is not valid JSON: ${error.message}`);
}

const features = Array.isArray(featureList.features) ? featureList.features : [];
for (const feature of features) {
  if (feature.status === "done") {
    const evidence = Array.isArray(feature.evidence) ? feature.evidence : [];
    if (evidence.length < 1) {
      fail(`Feature '${feature.id}' is done but has no evidence.`);
    }
  }
}

console.log("Harness handoff check passed.");
