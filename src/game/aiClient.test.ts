import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callAiModel, parseAiTurnResponse } from './aiClient';
import type { ModelConfig } from './types';

describe('aiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses clean JSON AI responses', () => {
    const parsed = parseAiTurnResponse(JSON.stringify({
      story_text: '雨继续下。',
      choice_point: '你要怎么做？',
      state_patch: { cluesAdded: ['银色徽章'] }
    }));

    expect(parsed.story_text).toBe('雨继续下。');
    expect(parsed.state_patch.cluesAdded).toEqual(['银色徽章']);
  });

  it('parses JSON wrapped in a markdown code block', () => {
    const parsed = parseAiTurnResponse(`\`\`\`json
{"story_text":"正文","choice_point":"抉择","state_patch":{}}
\`\`\``);

    expect(parsed.story_text).toBe('正文');
  });

  it('normalizes array and object text fields from flexible model output', () => {
    const parsed = parseAiTurnResponse(JSON.stringify({
      story_text: { paragraph1: '你走向钟楼。', paragraph2: '雨声更密了。' },
      choice_point: [
        { A: '继续前进' },
        { B: '回到档案室' }
      ],
      state_patch: {}
    }));

    expect(parsed.story_text).toContain('你走向钟楼。');
    expect(parsed.choice_point).toContain('继续前进');
  });

  it('repairs a missing comma between common AI JSON fields', () => {
    const parsed = parseAiTurnResponse(`{
      "story_text": "雨水落在钟楼上。"
      "choice_point": "你要怎么做？",
      "state_patch": {}
    }`);

    expect(parsed.story_text).toBe('雨水落在钟楼上。');
    expect(parsed.choice_point).toBe('你要怎么做？');
  });

  it('extracts JSON when the model adds text around it', () => {
    const parsed = parseAiTurnResponse(`下面是结果：
    {
      "story_text": "正文",
      "choice_point": "抉择",
      "state_patch": {}
    }
    以上。`);

    expect(parsed.story_text).toBe('正文');
  });

  it('escapes raw line breaks inside AI JSON strings', () => {
    const parsed = parseAiTurnResponse(`{
      "story_text": "第一行
第二行",
      "choice_point": "抉择",
      "state_patch": {}
    }`);

    expect(parsed.story_text).toBe('第一行\n第二行');
  });

  it('recovers usable text when the AI JSON is cut off after choice_point', () => {
    const parsed = parseAiTurnResponse(`{
      "story_text": "The door opens.",
      "choice_point": "Step inside or wait outside?"
    `);

    expect(parsed.story_text).toBe('The door opens.');
    expect(parsed.choice_point).toBe('Step inside or wait outside?');
    expect(parsed.state_patch).toEqual({});
  });

  it('recovers usable text when a trailing state_patch object is incomplete', () => {
    const parsed = parseAiTurnResponse(`{
      "story_text": "The bell rings again.",
      "choice_point": "Follow the sound.",
      "state_patch": { "location": "Clock tower"
    `);

    expect(parsed.story_text).toBe('The bell rings again.');
    expect(parsed.choice_point).toBe('Follow the sound.');
    expect(parsed.state_patch).toEqual({});
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

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/ai-proxy'), expect.objectContaining({
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
    )).rejects.toThrow('AI 请求失败，状态码 404，model not found');
  });

  it('adds /v1 to provider hosts that omit it', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
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

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/ai-proxy'), expect.objectContaining({
      body: expect.stringContaining('https://aihubmix.com/v1')
    }));
  });
});
