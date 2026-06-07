import type { DetectedObject, ProviderStatus } from "./types";

export async function fetchProviderStatus(): Promise<ProviderStatus> {
  const response = await fetch("/api/ai/config");
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "无法读取模型配置状态");
  }
  return data;
}

export async function requestSceneRecognition(payload: { imageDataUrl?: string; instruction?: string }) {
  const response = await fetch("/api/ai/recognize-scene", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "模型识别请求失败");
  }
  return data;
}

export function extractDetectedObjects(response: unknown): DetectedObject[] | null {
  const content = getAssistantContent(response);
  const parsed = typeof content === "string" ? parseJsonObject(content) : response;

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const objects = Array.isArray((parsed as { objects?: unknown }).objects)
    ? (parsed as { objects: unknown[] }).objects
    : null;

  if (!objects) {
    return null;
  }

  const normalized = objects
    .map((item, index) => normalizeDetectedObject(item, index))
    .filter((item): item is DetectedObject => Boolean(item));

  return normalized.length > 0 ? normalized : null;
}

function getAssistantContent(response: unknown) {
  if (!response || typeof response !== "object") {
    return null;
  }

  const choices = (response as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return response;
  }

  const firstChoice = choices[0];
  if (!firstChoice || typeof firstChoice !== "object") {
    return null;
  }

  const message = (firstChoice as { message?: unknown }).message;
  if (!message || typeof message !== "object") {
    return null;
  }

  return (message as { content?: unknown }).content ?? null;
}

function parseJsonObject(content: string) {
  const trimmed = content.trim();
  const withoutFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(withoutFence);
}

function normalizeDetectedObject(item: unknown, index: number): DetectedObject | null {
  if (!item || typeof item !== "object") {
    return null;
  }

  const object = item as Record<string, unknown>;
  const label = typeof object.label === "string" ? object.label : typeof object.name === "string" ? object.name : null;
  const category = typeof object.category === "string" ? object.category : label;

  if (!label || !category) {
    return null;
  }

  return {
    id: typeof object.id === "string" ? object.id : `model-object-${index + 1}`,
    label,
    category,
    confidence: clampNumber(object.confidence, 0.5, 0, 1),
    x: clampNumber(object.x, 12 + index * 8, 0, 100),
    y: clampNumber(object.y, 28 + index * 6, 0, 100),
    width: clampNumber(object.width, 22, 4, 100),
    height: clampNumber(object.height, 20, 4, 100)
  };
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, numeric));
}
