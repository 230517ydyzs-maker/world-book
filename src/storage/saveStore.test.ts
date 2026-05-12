import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllStories, getStory, listStories, saveStory } from './saveStore';
import type { SavedStory } from '../game/types';

const savedStory: SavedStory = {
  config: {
    id: 'story-1',
    title: '雨夜钟楼',
    genre: '悬疑',
    style: '严肃短篇',
    worldSetting: '旧城',
    rules: ['普通人不能施法'],
    playerCharacter: {
      name: '林舟',
      identity: '档案修复师',
      goal: '查清真相',
      abilities: ['观察'],
      weaknesses: ['体力较弱']
    },
    modelConfig: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test',
      model: 'test-model'
    },
    createdAt: '2026-05-12T00:00:00.000Z'
  },
  state: {
    storyId: 'story-1',
    turn: 0,
    maxTurns: 15,
    currentLocation: '故事开端',
    dangerLevel: 'low',
    endingProgress: 0,
    playerStatus: [],
    npcRegistry: [],
    clues: [],
    worldMemory: [],
    isEnded: false
  },
  turns: []
};

describe('saveStore', () => {
  beforeEach(async () => {
    await clearAllStories();
  });

  it('saves and loads a story', async () => {
    await saveStory(savedStory);

    await expect(getStory('story-1')).resolves.toEqual(savedStory);
  });

  it('lists stories without exposing API keys', async () => {
    await saveStory(savedStory);

    const stories = await listStories();

    expect(stories).toEqual([
      {
        id: 'story-1',
        title: '雨夜钟楼',
        turn: 0,
        maxTurns: 15,
        isEnded: false,
        updatedAt: expect.any(String)
      }
    ]);
  });
});
