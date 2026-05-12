import { describe, expect, it } from 'vitest';
import { createStoryFromInput, playActionTurn } from './storyEngine';

describe('storyEngine', () => {
  it('creates a saved story from creation input and opening AI result', async () => {
    const story = await createStoryFromInput(
      {
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
      },
      async () => ({
        verdict: 'allowed',
        verdict_reason: '开篇',
        story_text: '雨落在钟楼上。',
        choice_point: '你要进入钟楼吗？',
        state_patch: {
          currentLocation: '钟楼外',
          cluesAdded: ['钟楼']
        }
      })
    );

    expect(story.config.title).toBe('雨夜钟楼');
    expect(story.state.turn).toBe(1);
    expect(story.turns[0].storyText).toBe('雨落在钟楼上。');
    expect(story.state.clues).toEqual(['钟楼']);
  });

  it('does not advance state when AI rejects an action', async () => {
    const story = await createStoryFromInput(
      {
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
      },
      async () => ({
        verdict: 'allowed',
        verdict_reason: '开篇',
        story_text: '开篇正文',
        choice_point: '抉择点',
        state_patch: {}
      })
    );

    const next = await playActionTurn(story, '我召唤雷电毁掉城市。', async () => ({
      verdict: 'rejected',
      verdict_reason: '角色没有魔法能力。',
      story_text: '这个行动不符合当前角色能力，请换一种行动。',
      choice_point: '请重新输入合理行动。',
      state_patch: {}
    }));

    expect(next.state.turn).toBe(1);
    expect(next.turns).toHaveLength(2);
    expect(next.turns[1].verdict).toBe('rejected');
  });
});
