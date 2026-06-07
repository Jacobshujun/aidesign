import { assertSecret, HttpError, readUpstreamJson } from "../http.mjs";

function joinUrl(baseUrl, routePath) {
  return `${baseUrl.replace(/\/$/, "")}/${routePath.replace(/^\//, "")}`;
}

function withQuery(url, params) {
  const nextUrl = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      nextUrl.searchParams.set(key, value);
    }
  }
  return nextUrl;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await readUpstreamJson(response);
  if (!response.ok) {
    throw new HttpError(response.status, "RunningHub request failed.", data);
  }

  return data;
}

export async function getNodeInfo(config) {
  assertSecret(config.apiKey, "RUNNINGHUB_API_KEY");

  const url = withQuery(joinUrl(config.apiBaseUrl, config.nodeInfoPath), {
    apiKey: config.apiKey,
    webappId: config.webappId
  });
  const response = await fetch(url);
  const data = await readUpstreamJson(response);
  if (!response.ok) {
    throw new HttpError(response.status, "RunningHub node info request failed.", data);
  }

  return data;
}

export async function runAiApp(config, payload) {
  assertSecret(config.apiKey, "RUNNINGHUB_API_KEY");

  return postJson(joinUrl(config.apiBaseUrl, config.runPath), {
    webappId: payload.webappId || config.webappId,
    apiKey: config.apiKey,
    nodeInfoList: payload.nodeInfoList || []
  });
}

export async function getOutputs(config, payload) {
  assertSecret(config.apiKey, "RUNNINGHUB_API_KEY");
  if (!payload.taskId) {
    throw new HttpError(400, "taskId is required.");
  }

  return postJson(joinUrl(config.apiBaseUrl, config.outputsPath), {
    apiKey: config.apiKey,
    taskId: payload.taskId
  });
}

export async function uploadDataUrl(config, payload) {
  assertSecret(config.apiKey, "RUNNINGHUB_API_KEY");
  if (!payload.dataUrl || !payload.fileName) {
    throw new HttpError(400, "dataUrl and fileName are required.");
  }

  const match = /^data:(?<mime>[\w/+.-]+);base64,(?<data>.+)$/.exec(payload.dataUrl);
  if (!match?.groups) {
    throw new HttpError(400, "dataUrl must be a base64 data URL.");
  }

  const buffer = Buffer.from(match.groups.data, "base64");
  const form = new FormData();
  form.set("apiKey", config.apiKey);
  form.set("fileType", payload.fileType || "input");
  form.set("file", new Blob([buffer], { type: match.groups.mime }), payload.fileName);

  const response = await fetch(joinUrl(config.apiBaseUrl, config.uploadPath), {
    method: "POST",
    body: form
  });

  const data = await readUpstreamJson(response);
  if (!response.ok) {
    throw new HttpError(response.status, "RunningHub upload request failed.", data);
  }

  return data;
}
