import type { ChatMessage } from './promptBuilder';
import type { AiTurnResponse, ModelConfig, Verdict } from './types';

const verdicts: Verdict[] = ['allowed', 'allowed_with_cost', 'failed_forward', 'rejected'];

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

  return trimmed;
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
  const parsed = JSON.parse(extractJson(content)) as Partial<AiTurnResponse>;

  if (!parsed.verdict || !verdicts.includes(parsed.verdict)) {
    throw new Error('Invalid AI verdict');
  }
  const verdictReason = normalizeTextField(parsed.verdict_reason, 'verdict_reason');
  const storyText = normalizeTextField(parsed.story_text, 'story_text');
  const choicePoint = normalizeTextField(parsed.choice_point, 'choice_point');

  return {
    verdict: parsed.verdict,
    verdict_reason: verdictReason,
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
      return `AI 请求失败，状态码 ${response.status}：${message}`;
    }
  } catch {
    return `AI 请求失败，状态码 ${response.status}：${text.slice(0, 240)}`;
  }

  return `AI 请求失败，状态码 ${response.status}：${text.slice(0, 240)}`;
}

export async function callAiModel(
  config: ModelConfig,
  messages: ChatMessage[],
  fetcher: typeof fetch = fetch
): Promise<AiTurnResponse> {
  const response = await fetcher('http://localhost:8787/api/ai-proxy', {
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
