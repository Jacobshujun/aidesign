import fs from "node:fs";
import path from "node:path";
import { isConfiguredSecret } from "./http.mjs";

const root = process.cwd();

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function loadEnvFile(relativePath) {
  const envPath = path.join(root, relativePath);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed && process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

export function getServerConfig() {
  return {
    port: Number(process.env.AI_PROXY_PORT || 8787),
    textModel: {
      baseUrl: process.env.AI_TEXT_BASE_URL || "https://right.codes/codex/v1",
      model: process.env.AI_TEXT_MODEL || "gpt-5.5",
      apiKey: process.env.AI_TEXT_API_KEY || ""
    },
    runningHub: {
      apiBaseUrl: process.env.RUNNINGHUB_API_BASE_URL || "https://www.runninghub.cn",
      webappId: process.env.RUNNINGHUB_WEBAPP_ID || "2004543527918551041",
      apiKey: process.env.RUNNINGHUB_API_KEY || "",
      nodeInfoPath: process.env.RUNNINGHUB_NODE_INFO_PATH || "/api/webapp/apiCallDemo",
      runPath: process.env.RUNNINGHUB_RUN_PATH || "/task/openapi/ai-app/run",
      outputsPath: process.env.RUNNINGHUB_OUTPUTS_PATH || "/task/openapi/outputs",
      uploadPath: process.env.RUNNINGHUB_UPLOAD_PATH || "/task/openapi/upload"
    }
  };
}

export function getPublicProviderStatus() {
  const config = getServerConfig();
  return {
    textModel: {
      configured: isConfiguredSecret(config.textModel.apiKey),
      baseUrl: config.textModel.baseUrl,
      model: config.textModel.model
    },
    runningHub: {
      configured: isConfiguredSecret(config.runningHub.apiKey),
      apiBaseUrl: config.runningHub.apiBaseUrl,
      webappId: config.runningHub.webappId
    }
  };
}
