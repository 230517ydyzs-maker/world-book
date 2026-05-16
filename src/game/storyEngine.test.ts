import { describe, expect, it } from 'vitest';
import { createStoryFromInput, playActionTurn } from './storyEngine';

const input = {
  title: '雨夜钟楼',
  genre: '悬疑',
  style: '严肃短篇',
  worldSetting: '旧城',
  rulesText: '普通人不能施法\n午夜钟声会改变记忆',
  characterName: '林舟',
  characterIdentity: '档案修复师',
  characterGoal: '查清真相',
  abilitiesText: '观察\n推理',
  weaknessesText: '体力较弱',
  baseUrl: 'https://api.example.com/v1',
  apiKey: 'sk-test',
  model: 'test-model'
};

describe('storyEngine', () => {
  it('creates a saved story from creation input and opening AI result', async () => {
    const story = await createStoryFromInput(input, async () => ({
      story_text: '雨落在钟楼上。',
      choice_point: '你要进入钟楼吗？',
      state_patch: {
        currentLocation: '钟楼外',
        cluesAdded: ['钟楼']
      }
    }));

    expect(story.config.title).toBe('雨夜钟楼');
    expect(story.state.turn).toBe(1);
    expect(story.turns[0].storyText).toBe('雨落在钟楼上。');
    expect(story.state.clues).toEqual(['钟楼']);
  });

  it('advances every player action without a review result', async () => {
    const story = await createStoryFromInput(input, async () => ({
      story_text: '开篇正文。',
      choice_point: '抉择点',
      state_patch: {}
    }));

    const next = await playActionTurn(story, '我召唤雷电劈掉城市。', async () => ({
      story_text: '雷声在旧城上空滚过，远处的街灯同时熄灭。',
      choice_point: '继续追查或躲进钟楼。',
      state_patch: {}
    }));

    expect(next.state.turn).toBe(2);
    expect(next.turns).toHaveLength(2);
    expect(next.turns[1].storyText).toContain('雷声');
  });

  it('drops the choice point on the final advancing turn', async () => {
    const story = await createStoryFromInput(input, async () => ({
      story_text: '开篇正文。',
      choice_point: '抉择点',
      state_patch: {}
    }));
    const finalSetup = {
      ...story,
      state: {
        ...story.state,
        turn: 14,
        maxTurns: 15
      }
    };

    const next = await playActionTurn(finalSetup, '我走向结局。', async () => ({
      story_text: '故事结束。',
      choice_point: '下一步建议',
      state_patch: {}
    }));

    expect(next.state.isEnded).toBe(true);
    expect(next.turns.at(-1)?.choicePoint).toBe('');
  });
});
