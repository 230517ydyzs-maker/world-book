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
  it('builds opening prompts requiring strict JSON', () => {
    const messages = buildOpeningPrompt(story);

    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('只输出 JSON');
    expect(messages[1].content).toContain('雨夜钟楼');
    expect(messages[1].content).toContain('普通人不能施法');
  });

  it('builds turn prompts with recent history and player action', () => {
    const turns: TurnLog[] = [
      {
        storyId: 'story-1',
        turn: 1,
        playerAction: '我观察徽章。',
        verdict: 'allowed',
        verdictReason: '符合能力。',
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
});
