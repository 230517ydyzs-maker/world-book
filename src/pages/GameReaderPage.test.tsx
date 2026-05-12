import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameReaderPage from './GameReaderPage';
import { useGameStore } from '../store/useGameStore';

describe('GameReaderPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      isLoading: false,
      error: undefined,
      loadStory: vi.fn().mockResolvedValue(undefined),
      playAction: vi.fn().mockResolvedValue(undefined),
      currentStory: {
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
          modelConfig: { baseUrl: 'x', apiKey: 'x', model: 'x' },
          createdAt: '2026-05-12T00:00:00.000Z'
        },
        state: {
          storyId: 'story-1',
          turn: 3,
          maxTurns: 15,
          currentLocation: '钟楼',
          dangerLevel: 'medium',
          endingProgress: 0.2,
          playerStatus: ['紧张'],
          npcRegistry: [{ name: '守夜人', attitude: '戒备', knownFacts: ['知道旧案'] }],
          clues: ['银色徽章'],
          worldMemory: ['午夜钟声会改变记忆'],
          isEnded: false
        },
        turns: [
          {
            storyId: 'story-1',
            turn: 3,
            playerAction: '询问守夜人',
            verdict: 'allowed',
            verdictReason: '合理',
            storyText: '雨水敲在钟楼的铜檐上。',
            choicePoint: '你要怎么做？',
            statePatch: {},
            createdAt: '2026-05-12T00:00:00.000Z'
          }
        ]
      }
    });
  });

  it('renders novel prose, sidebar state, and action input', async () => {
    render(<GameReaderPage storyId="story-1" />);

    expect(screen.getByRole('heading', { name: '雨夜钟楼' })).toBeInTheDocument();
    expect(screen.getByText('雨水敲在钟楼的铜檐上。')).toBeInTheDocument();
    expect(screen.getByText('守夜人')).toBeInTheDocument();
    expect(screen.getByLabelText('输入你的行动')).toBeInTheDocument();
  });

  it('submits player actions', async () => {
    const playAction = vi.fn().mockResolvedValue(undefined);
    useGameStore.setState({ playAction });
    const user = userEvent.setup();

    render(<GameReaderPage storyId="story-1" />);

    await user.type(screen.getByLabelText('输入你的行动'), '我继续追问。');
    await user.click(screen.getByRole('button', { name: '发送' }));

    expect(playAction).toHaveBeenCalledWith('我继续追问。');
  });
});
