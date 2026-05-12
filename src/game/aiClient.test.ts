import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callAiModel, parseAiTurnResponse } from './aiClient';
import type { ModelConfig } from './types';

describe('aiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses clean JSON AI responses', () => {
    const parsed = parseAiTurnResponse(JSON.stringify({
      verdict: 'allowed',
      verdict_reason: '符合设定',
      story_text: '雨继续下。',
      choice_point: '你要怎么做？',
      state_patch: { cluesAdded: ['银色徽章'] }
    }));

    expect(parsed.verdict).toBe('allowed');
    expect(parsed.state_patch.cluesAdded).toEqual(['银色徽章']);
  });

  it('parses JSON wrapped in a markdown code block', () => {
    const parsed = parseAiTurnResponse(`\`\`\`json
{"verdict":"allowed","verdict_reason":"符合设定","story_text":"正文","choice_point":"抉择","state_patch":{}}
\`\`\``);

    expect(parsed.story_text).toBe('正文');
  });

  it('rejects invalid verdict values', () => {
    expect(() => parseAiTurnResponse(JSON.stringify({
      verdict: 'maybe',
      verdict_reason: 'x',
      story_text: 'x',
      choice_point: 'x',
      state_patch: {}
    }))).toThrow('Invalid AI verdict');
  });

  it('calls OpenAI-compatible chat completions endpoint', async () => {
    const config: ModelConfig = {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test',
      model: 'test-model'
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict: 'allowed',
                verdict_reason: '符合设定',
                story_text: '正文',
                choice_point: '抉择',
                state_patch: {}
              })
            }
          }
        ]
      })
    });

    const result = await callAiModel(config, [{ role: 'user', content: 'hello' }], fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('/api/ai-proxy', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      body: expect.stringContaining('https://api.example.com/v1')
    }));
    expect(result.story_text).toBe('正文');
  });

  it('surfaces upstream error response bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({
        error: {
          message: 'model not found'
        }
      })
    });

    await expect(callAiModel(
      { baseUrl: 'https://aihubmix.com/v1', apiKey: 'sk-test', model: 'deepseek-v4-flash' },
      [{ role: 'user', content: 'hello' }],
      fetchMock
    )).rejects.toThrow('AI 请求失败，状态码 404：model not found');
  });

  it('adds /v1 to provider hosts that omit it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict: 'allowed',
                verdict_reason: '符合设定',
                story_text: '正文',
                choice_point: '抉择',
                state_patch: {}
              })
            }
          }
        ]
      })
    });

    await callAiModel(
      { baseUrl: 'https://aihubmix.com', apiKey: 'sk-test', model: 'deepseek-v4-flash' },
      [{ role: 'user', content: 'hello' }],
      fetchMock
    );

    expect(fetchMock).toHaveBeenCalledWith('/api/ai-proxy', expect.objectContaining({
      body: expect.stringContaining('https://aihubmix.com/v1')
    }));
  });
});
