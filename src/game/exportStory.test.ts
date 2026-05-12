import { describe, expect, it } from 'vitest';
import { buildStoryExportText } from './exportStory';
import type { SavedStory } from './types';

describe('exportStory', () => {
  it('builds readable novel text from saved story turns', () => {
    const story: SavedStory = {
      config: {
        id: 'story-1',
        title: '雨夜钟楼',
        genre: '悬疑',
        style: '严肃短篇',
        worldSetting: '旧城',
        rules: [],
        playerCharacter: {
          name: '林舟',
          identity: '档案修复师',
          goal: '查清真相',
          abilities: [],
          weaknesses: []
        },
        modelConfig: { baseUrl: 'x', apiKey: 'secret', model: 'x' },
        createdAt: '2026-05-12T00:00:00.000Z'
      },
      state: {
        storyId: 'story-1',
        turn: 1,
        maxTurns: 15,
        currentLocation: '钟楼',
        dangerLevel: 'low',
        endingProgress: 0,
        playerStatus: [],
        npcRegistry: [],
        clues: [],
        worldMemory: [],
        isEnded: false
      },
      turns: [
        {
          storyId: 'story-1',
          turn: 1,
          playerAction: '故事开始',
          verdict: 'allowed',
          verdictReason: '开篇',
          storyText: '雨落下。',
          choicePoint: '你要怎么做？',
          statePatch: {},
          createdAt: '2026-05-12T00:00:00.000Z'
        }
      ]
    };

    const text = buildStoryExportText(story);

    expect(text).toContain('雨夜钟楼');
    expect(text).toContain('雨落下。');
    expect(text).not.toContain('secret');
  });
});
