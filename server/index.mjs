import http from "node:http";
import { getPublicProviderStatus, getServerConfig } from "./config.mjs";
import { HttpError, readJson, sendJson, sendOptions } from "./http.mjs";
import { chatCompletion, recognizeFurniture } from "./providers/textModel.mjs";
import { getNodeInfo, getOutputs, runAiApp, uploadDataUrl } from "./providers/runningHub.mjs";

const config = getServerConfig();

async function routeRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

  if (request.method === "OPTIONS") {
    sendOptions(response);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { ok: true, providers: getPublicProviderStatus() });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/ai/config") {
    sendJson(response, 200, getPublicProviderStatus());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ai/chat") {
    const payload = await readJson(request);
    const data = await chatCompletion(config.textModel, payload);
    sendJson(response, 200, data);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/ai/recognize-scene") {
    const payload = await readJson(request);
    const data = await recognizeFurniture(config.textModel, payload);
    sendJson(response, 200, data);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/runninghub/node-info") {
    const data = await getNodeInfo(config.runningHub);
    sendJson(response, 200, data);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/runninghub/run") {
    const payload = await readJson(request);
    const data = await runAiApp(config.runningHub, payload);
    sendJson(response, 200, data);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/runninghub/outputs") {
    const payload = await readJson(request);
    const data = await getOutputs(config.runningHub, payload);
    sendJson(response, 200, data);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/runninghub/upload") {
    const payload = await readJson(request);
    const data = await uploadDataUrl(config.runningHub, payload);
    sendJson(response, 200, data);
    return;
  }

  throw new HttpError(404, `Route not found: ${request.method} ${url.pathname}`);
}

const server = http.createServer((request, response) => {
  routeRequest(request, response).catch((error) => {
    const status = error instanceof HttpError ? error.status : 500;
    sendJson(response, status, {
      error: error.message || "Unexpected server error.",
      details: error instanceof HttpError ? error.details : undefined
    });
  });
});

server.listen(config.port, "127.0.0.1", () => {
  console.log(`AI proxy listening at http://127.0.0.1:${config.port}`);
});
