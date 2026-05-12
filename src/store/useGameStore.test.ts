import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './useGameStore';
import { clearAllStories } from '../storage/saveStore';

describe('useGameStore', () => {
  beforeEach(async () => {
    await clearAllStories();
    useGameStore.setState({
      currentStory: undefined,
      isLoading: false,
      error: undefined
    });
  });

  it('stores errors from failed story creation', async () => {
    await useGameStore.getState().createStory({
      title: '雨夜钟楼',
      genre: '悬疑',
      style: '严肃短篇',
      worldSetting: '旧城',
      rulesText: '普通人不能施法',
      characterName: '林舟',
      characterIdentity: '档案修复师',
      characterGoal: '查清真相',
      abilitiesText: '观察',
      weaknessesText: '体力较弱',
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test',
      model: 'test-model'
    }, async () => {
      throw new Error('AI unavailable');
    });

    expect(useGameStore.getState().error).toBe('AI unavailable');
    expect(useGameStore.getState().isLoading).toBe(false);
  });
});
