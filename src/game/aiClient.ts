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

export function parseAiTurnResponse(content: string): AiTurnResponse {
  const parsed = JSON.parse(extractJson(content)) as Partial<AiTurnResponse>;

  if (!parsed.verdict || !verdicts.includes(parsed.verdict)) {
    throw new Error('Invalid AI verdict');
  }
  if (typeof parsed.verdict_reason !== 'string') throw new Error('Invalid AI verdict_reason');
  if (typeof parsed.story_text !== 'string') throw new Error('Invalid AI story_text');
  if (typeof parsed.choice_point !== 'string') throw new Error('Invalid AI choice_point');

  return {
    verdict: parsed.verdict,
    verdict_reason: parsed.verdict_reason,
    story_text: parsed.story_text,
    choice_point: parsed.choice_point,
    state_patch: parsed.state_patch ?? {}
  };
}

export async function callAiModel(
  config: ModelConfig,
  messages: ChatMessage[],
  fetcher: typeof fetch = fetch
): Promise<AiTurnResponse> {
  const response = await fetcher('/api/ai-proxy', {
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
    throw new Error(error instanceof TypeError ? '本地 AI 代理不可用，请确认开发服务器已重启' : 'AI 请求失败');
  });

  if (!response.ok) {
    throw new Error(`AI 请求失败，状态码 ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('AI 响应缺少正文内容');
  }

  return parseAiTurnResponse(content);
}
