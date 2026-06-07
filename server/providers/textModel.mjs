import { assertSecret, HttpError, readUpstreamJson } from "../http.mjs";

export async function chatCompletion(config, payload) {
  assertSecret(config.apiKey, "AI_TEXT_API_KEY");

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      temperature: payload.temperature ?? 0.2,
      messages: payload.messages,
      response_format: payload.response_format
    })
  });

  const data = await readUpstreamJson(response);
  if (!response.ok) {
    throw new HttpError(response.status, "Text model request failed.", data);
  }

  return data;
}

export async function recognizeFurniture(config, payload) {
  const imageContent = payload.imageDataUrl
    ? [
        {
          type: "text",
          text: "识别这张室内场景图中的家具单品，返回 JSON：objects 数组，每项包含 label、category、confidence、x、y、width、height，坐标用百分比。"
        },
        {
          type: "image_url",
          image_url: {
            url: payload.imageDataUrl
          }
        }
      ]
    : `根据当前前端 mock 场景语义，返回可用于家具替换工作台的家具识别 JSON。补充说明：${payload.instruction || "无"}`;

  return chatCompletion(config, {
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "你是室内场景家具识别助手，只返回结构化 JSON，不返回 Markdown。"
      },
      {
        role: "user",
        content: imageContent
      }
    ]
  });
}
