import { describe, expect, it } from 'vitest';
import { buildOpeningPrompt, buildTurnPrompt } from './promptBuilder';
import type { GameState, StoryConfig, TurnLog } from './types';

const story: StoryConfig = {
  id: 'story-1',
  title: '雨夜钟楼',
  genre: '悬疑',
  style: '严肃短篇',
  worldSetting: '旧城午夜会响起第十三声钟。',
  rules: ['普通人不能施法'],
  playerCharacter: {
    name: '林舟',
    identity: '档案修复师',
    goal: '查清父亲失踪真相',
    abilities: ['观察'],
    weaknesses: ['体力较弱']
  },
  modelConfig: { baseUrl: 'https://api.example.com/v1', apiKey: 'sk-test', model: 'test' },
  createdAt: '2026-05-12T00:00:00.000Z'
};

const state: GameState = {
  storyId: 'story-1',
  turn: 2,
  maxTurns: 15,
  currentLocation: '钟楼',
  dangerLevel: 'medium',
  endingProgress: 0.2,
  playerStatus: ['紧张'],
  npcRegistry: [],
  clues: ['银色徽章'],
  worldMemory: ['守夜人知道旧案'],
  isEnded: false
};

describe('promptBuilder', () => {
  it('builds opening prompts requiring strict JSON without review fields', () => {
    const messages = buildOpeningPrompt(story);

    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('只输出 JSON');
    expect(messages[0].content).toContain('必须是可被 JSON.parse 直接解析的合法 JSON');
    expect(messages[0].content).toContain('JSON 字段必须包含 story_text, choice_point, state_patch');
    expect(messages[0].content).not.toContain('verdict');
    expect(messages[0].content).not.toContain('verdict_reason');
    expect(messages[1].content).toContain('雨夜钟楼');
    expect(messages[1].content).toContain('普通人不能施法');
  });

  it('adds anti-summary prose rules to the system prompt', () => {
    const messages = buildTurnPrompt(story, state, [], '我询问守夜人。');

    expect(messages[0].content).toContain('避免总结式、解说式写法');
    expect(messages[0].content).toContain('每回合只推进一个主要事件');
    expect(messages[0].content).toContain('通过动作、环境、对话和可见细节呈现');
    expect(messages[0].content).toContain('不要使用“显然、与此同时、然而、他意识到');
  });

  it('folds AgentGal-style narrator, soul, memory, and choice guidance into the prompt', () => {
    const messages = buildTurnPrompt(story, state, [], '我走向钟楼。');

    expect(messages[0].content).toContain('角色灵魂');
    expect(messages[0].content).toContain('场景调度');
    expect(messages[0].content).toContain('长期记忆');
    expect(messages[0].content).toContain('行动建议');
    expect(messages[0].content).toContain('玩家可说或可做的一句话');
  });

  it('makes NPCs, clues, and world rules active story constraints', () => {
    const messages = buildTurnPrompt(
      story,
      {
        ...state,
        npcRegistry: [{ name: '守夜人', attitude: '戒备', knownFacts: ['知道旧案'] }]
      },
      [],
      '我拿出银色徽章询问守夜人。'
    );

    expect(messages[0].content).toContain('已出现 NPC 不得无故消失或被遗忘');
    expect(messages[0].content).toContain('当玩家行动涉及线索时，线索必须影响结果');
    expect(messages[0].content).toContain('世界规则用于塑造后果和代价');
    expect(messages[1].content).toContain('守夜人(戒备：知道旧案)');
    expect(messages[1].content).toContain('银色徽章');
  });

  it('asks for varied human-like pacing without exposing director notes', () => {
    const messages = buildTurnPrompt(story, state, [], '我继续调查钟楼。');

    expect(messages[0].content).toContain('先在内部完成导演层思考');
    expect(messages[0].content).toContain('不要输出导演层');
    expect(messages[0].content).toContain('每 3 回合至少改变一次叙事节奏');
    expect(messages[0].content).toContain('禁止连续两回合使用同一种结尾方式');
    expect(messages[0].content).toContain('不要每回合都抛出重大设定发现');
  });

  it('tells the AI to continue from any player action without review language', () => {
    const messages = buildTurnPrompt(story, state, [], '我召唤禁忌魔法。');

    expect(messages[0].content).toContain('玩家输入的任何行动都已经发生');
    expect(messages[1].content).toContain('无论玩家输入什么，都按已经发生的行动继续写剧情');
    expect(messages[1].content).not.toContain('审查');
    expect(messages[1].content).not.toContain('裁判');
    expect(messages[1].content).not.toContain('verdict');
  });

  it('builds turn prompts with recent history and player action', () => {
    const turns: TurnLog[] = [
      {
        storyId: 'story-1',
        turn: 1,
        playerAction: '我观察徽章。',
        storyText: '你看见徽章编号。',
        choicePoint: '你要怎么做？',
        statePatch: {},
        createdAt: '2026-05-12T00:00:00.000Z'
      }
    ];

    const messages = buildTurnPrompt(story, state, turns, '我询问守夜人。');

    expect(messages[1].content).toContain('我询问守夜人。');
    expect(messages[1].content).toContain('银色徽章');
    expect(messages[1].content).toContain('你看见徽章编号。');
  });

  it('asks for an ending without a choice point on the final turn', () => {
    const messages = buildTurnPrompt(
      story,
      { ...state, turn: 14, maxTurns: 15 },
      [],
      '我推开最后一扇门。'
    );

    expect(messages[1].content).toContain('这是最后一个回合');
    expect(messages[1].content).toContain('不要生成下一步抉择');
  });
});
