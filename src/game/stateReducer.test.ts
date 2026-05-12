import { describe, expect, it } from 'vitest';
import { applyStatePatch, createInitialGameState } from './stateReducer';
import type { AiStatePatch, StoryConfig } from './types';

const story: StoryConfig = {
  id: 'story-1',
  title: '雨夜钟楼',
  genre: '悬疑',
  style: '严肃短篇',
  worldSetting: '旧城钟楼每晚响起第十三声钟。',
  rules: ['普通人不能施法'],
  playerCharacter: {
    name: '林舟',
    identity: '档案修复师',
    goal: '查清父亲失踪真相',
    abilities: ['观察', '推理'],
    weaknesses: ['体力较弱']
  },
  modelConfig: {
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    model: 'test-model'
  },
  createdAt: '2026-05-12T00:00:00.000Z'
};

describe('stateReducer', () => {
  it('creates the initial short-story game state', () => {
    const state = createInitialGameState(story, 15);

    expect(state.storyId).toBe('story-1');
    expect(state.turn).toBe(0);
    expect(state.maxTurns).toBe(15);
    expect(state.dangerLevel).toBe('low');
    expect(state.endingProgress).toBe(0);
  });

  it('applies AI state patches without duplicating clues or rules', () => {
    const state = createInitialGameState(story, 15);
    const patch: AiStatePatch = {
      currentLocation: '旧城钟楼',
      dangerLevel: 'medium',
      endingProgressDelta: 0.2,
      playerStatusAdded: ['紧张'],
      cluesAdded: ['银色徽章', '银色徽章'],
      worldMemoryAdded: ['守夜人知道旧案'],
      npcUpdates: [
        {
          name: '守夜人',
          attitude: '戒备',
          knownFacts: ['知道主角父亲']
        }
      ]
    };

    const next = applyStatePatch(state, patch);

    expect(next.currentLocation).toBe('旧城钟楼');
    expect(next.dangerLevel).toBe('medium');
    expect(next.endingProgress).toBe(0.2);
    expect(next.playerStatus).toEqual(['紧张']);
    expect(next.clues).toEqual(['银色徽章']);
    expect(next.worldMemory).toEqual(['守夜人知道旧案']);
    expect(next.npcRegistry).toEqual([
      {
        name: '守夜人',
        attitude: '戒备',
        knownFacts: ['知道主角父亲']
      }
    ]);
  });
});
