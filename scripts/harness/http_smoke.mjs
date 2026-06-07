const targetUrl = process.env.HARNESS_SMOKE_URL ?? "http://127.0.0.1:5173/";

const response = await fetch(targetUrl);
if (!response.ok) {
  throw new Error(`HTTP smoke failed for ${targetUrl}: ${response.status} ${response.statusText}`);
}

const html = await response.text();
if (!html.includes('<div id="root"></div>')) {
  throw new Error(`HTTP smoke failed for ${targetUrl}: root mount node was not found.`);
}

const configUrl = new URL("/api/ai/config", targetUrl);
const configResponse = await fetch(configUrl);
if (!configResponse.ok) {
  throw new Error(`HTTP smoke failed for ${configUrl}: ${configResponse.status} ${configResponse.statusText}`);
}

const providerStatus = await configResponse.json();
if (!providerStatus.textModel || !providerStatus.runningHub) {
  throw new Error(`HTTP smoke failed for ${configUrl}: provider status is incomplete.`);
}

console.log(`HTTP smoke passed for ${targetUrl}.`);
