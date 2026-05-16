import type { ChatMessage } from './promptBuilder';
import type { AiTurnResponse, ModelConfig } from './types';

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

function extractJson(content: string): string {
  const trimmed = content.trim();
  const codeBlockMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  const objectStart = trimmed.indexOf('{');
  const objectEnd = trimmed.lastIndexOf('}');

  if (objectStart >= 0 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  return trimmed;
}

function escapeRawLineBreaksInStrings(json: string): string {
  let output = '';
  let inString = false;
  let escaped = false;

  for (const char of json) {
    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      output += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      output += char;
      continue;
    }

    if (inString && char === '\n') {
      output += '\\n';
      continue;
    }

    if (inString && char === '\r') {
      continue;
    }

    output += char;
  }

  return output;
}

function repairMissingFieldCommas(json: string): string {
  return json.replace(
    /("(?:story_text|choice_point)"\s*:\s*(?:"(?:[^"\\]|\\.)*"|\{[\s\S]*?\}|\[[\s\S]*?\]))\s*(?="(?:story_text|choice_point|state_patch)"\s*:)/g,
    '$1,'
  );
}

function readJsonStringField(json: string, fieldName: keyof AiTurnResponse): string | undefined {
  const fieldMarker = `"${fieldName}"`;
  const markerIndex = json.indexOf(fieldMarker);
  if (markerIndex < 0) {
    return undefined;
  }

  const colonIndex = json.indexOf(':', markerIndex + fieldMarker.length);
  if (colonIndex < 0) {
    return undefined;
  }

  let valueStart = colonIndex + 1;
  while (/\s/.test(json[valueStart] ?? '')) {
    valueStart += 1;
  }

  if (json[valueStart] !== '"') {
    return undefined;
  }

  let output = '';
  let escaped = false;
  for (let index = valueStart + 1; index < json.length; index += 1) {
    const char = json[index];
    if (escaped) {
      output += `\\${char}`;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      try {
        return JSON.parse(`"${output}"`) as string;
      } catch {
        return output;
      }
    }

    if (char === '\n') {
      output += '\\n';
      continue;
    }

    if (char !== '\r') {
      output += char;
    }
  }

  return undefined;
}

function parsePartialAiResponse(json: string): Partial<AiTurnResponse> | null {
  const storyText = readJsonStringField(json, 'story_text');
  const choicePoint = readJsonStringField(json, 'choice_point');

  if (!storyText || choicePoint === undefined) {
    return null;
  }

  return {
    story_text: storyText,
    choice_point: choicePoint,
    state_patch: {}
  };
}

function parseJsonWithRepairs(content: string): Partial<AiTurnResponse> {
  const json = extractJson(content);

  try {
    return JSON.parse(json) as Partial<AiTurnResponse>;
  } catch {
    const repaired = repairMissingFieldCommas(escapeRawLineBreaksInStrings(json));
    try {
      return JSON.parse(repaired) as Partial<AiTurnResponse>;
    } catch {
      const partial = parsePartialAiResponse(repaired);
      if (partial) {
        return partial;
      }

      throw new Error('AI 返回的 JSON 格式不完整，请重试或换一个模型');
    }
  }
}

function normalizeTextField(value: unknown, fieldName: string): string {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeTextField(item, fieldName)).join('\n');
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .map((item) => normalizeTextField(item, fieldName))
      .join('\n');
  }

  throw new Error(`Invalid AI ${fieldName}`);
}

export function parseAiTurnResponse(content: string): AiTurnResponse {
  const parsed = parseJsonWithRepairs(content);
  const storyText = normalizeTextField(parsed.story_text, 'story_text');
  const choicePoint = normalizeTextField(parsed.choice_point, 'choice_point');

  return {
    story_text: storyText,
    choice_point: choicePoint,
    state_patch: parsed.state_patch ?? {}
  };
}

async function responseErrorMessage(response: Response): Promise<string> {
  const text = await response.text();

  if (!text) {
    return `AI 请求失败，状态码 ${response.status}`;
  }

  try {
    const payload = JSON.parse(text);
    const message = payload?.error?.message ?? payload?.message ?? payload?.error;
    if (typeof message === 'string') {
      return `AI 请求失败，状态码 ${response.status}，${message}`;
    }
  } catch {
    return `AI 请求失败，状态码 ${response.status}，${text.slice(0, 240)}`;
  }

  return `AI 请求失败，状态码 ${response.status}，${text.slice(0, 240)}`;
}

export async function callAiModel(
  config: ModelConfig,
  messages: ChatMessage[],
  fetcher: typeof fetch = fetch
): Promise<AiTurnResponse> {
  const proxyUrl = import.meta.env.DEV
    ? 'http://localhost:8787/api/ai-proxy'
    : '/api/ai-proxy';
  const response = await fetcher(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      baseUrl: normalizeBaseUrl(config.baseUrl),
      apiKey: config.apiKey,
      model: config.model,
      temperature: 0.8,
      messages
    })
  }).catch((error) => {
    throw new Error(error instanceof TypeError ? '本地 AI 代理不可用，请确认代理服务已启动' : 'AI 请求失败');
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('AI 响应缺少正文内容');
  }

  return parseAiTurnResponse(content);
}
