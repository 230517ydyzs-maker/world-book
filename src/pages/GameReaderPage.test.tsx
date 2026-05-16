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
          worldSetting: '旧城午夜会响起第十三声钟。',
          rules: ['普通人不能施法', '午夜钟声会改变记忆'],
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
            storyText: '雨水敲在钟楼的铜檐上。',
            choicePoint: '你要怎么做？',
            statePatch: {},
            createdAt: '2026-05-12T00:00:00.000Z'
          }
        ]
      }
    });
  });

  it('renders novel prose, two transparent sidebars, and action input', async () => {
    render(<GameReaderPage storyId="story-1" />);

    expect(screen.getByRole('heading', { name: '雨夜钟楼' })).toBeInTheDocument();
    expect(screen.getByText('雨水敲在钟楼的铜檐上。')).toBeInTheDocument();
    expect(screen.queryByText('你要怎么做？')).not.toBeInTheDocument();
    expect(document.querySelector('.story-info-bar')).toBeNull();
    expect(screen.getByRole('complementary', { name: '左侧故事信息' })).toHaveClass('sidebar-left');
    expect(screen.getByRole('complementary', { name: '右侧故事信息' })).toHaveClass('sidebar-right');
    expect(screen.getByRole('button', { name: '角色卡' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '世界设定' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '人物' })).toBeInTheDocument();
    expect(screen.getByLabelText('输入你的行动')).toBeInTheDocument();
  });

  it('places character and world setup on the left and runtime modules on the right', () => {
    render(<GameReaderPage storyId="story-1" />);

    const left = screen.getByRole('complementary', { name: '左侧故事信息' });
    const right = screen.getByRole('complementary', { name: '右侧故事信息' });

    expect(left).toHaveTextContent('角色卡');
    expect(left).toHaveTextContent('世界设定');
    expect(left).not.toHaveTextContent('世界记忆');
    expect(left).not.toHaveTextContent('人物');
    expect(left).not.toHaveTextContent('线索');
    expect(left).not.toHaveTextContent('状态');

    expect(right).toHaveTextContent('世界记忆');
    expect(right).toHaveTextContent('人物');
    expect(right).toHaveTextContent('线索');
    expect(right).toHaveTextContent('状态');
    expect(right).not.toHaveTextContent('角色卡');
    expect(right).not.toHaveTextContent('世界设定');
  });

  it('hides nested character and world groups until their parent group is opened', async () => {
    const user = userEvent.setup();

    render(<GameReaderPage storyId="story-1" />);

    expect(screen.getByText('地点：钟楼')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '身份' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '能力' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '弱点' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '世界观' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '世界规则' })).not.toBeInTheDocument();
    expect(screen.queryByText('林舟，档案修复师')).not.toBeInTheDocument();
    expect(screen.queryByText('观察')).not.toBeInTheDocument();
    expect(screen.queryByText('体力较弱')).not.toBeInTheDocument();
    expect(screen.queryByText('旧城午夜会响起第十三声钟。')).not.toBeInTheDocument();
    expect(screen.queryByText('午夜钟声会改变记忆')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '角色卡' }));
    await user.click(screen.getByRole('button', { name: '世界设定' }));

    expect(screen.getByRole('button', { name: '身份' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '能力' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '弱点' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '世界观' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '世界规则' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '身份' }));
    await user.click(screen.getByRole('button', { name: '能力' }));
    await user.click(screen.getByRole('button', { name: '弱点' }));
    await user.click(screen.getByRole('button', { name: '世界观' }));
    await user.click(screen.getByRole('button', { name: '世界规则' }));
    await user.click(screen.getByRole('button', { name: '世界记忆' }));
    await user.click(screen.getByRole('button', { name: '线索' }));
    await user.click(screen.getByRole('button', { name: '人物' }));

    expect(screen.getByText('林舟，档案修复师')).toBeInTheDocument();
    expect(screen.getByText('观察')).toBeInTheDocument();
    expect(screen.getByText('体力较弱')).toBeInTheDocument();
    expect(screen.getByText('旧城午夜会响起第十三声钟。')).toBeInTheDocument();
    expect(screen.getAllByText('午夜钟声会改变记忆')).toHaveLength(2);
    expect(screen.getByText('银色徽章')).toBeInTheDocument();
    expect(screen.getByText('知道旧案')).toBeInTheDocument();
  });

  it('returns to the create page without deleting the current save', async () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { assign },
      writable: true
    });
    const user = userEvent.setup();

    render(<GameReaderPage storyId="story-1" />);

    await user.click(screen.getByRole('button', { name: '返回创建' }));

    expect(assign).toHaveBeenCalledWith('/create');
  });

  it('shows interactive choice suggestions beside the action input and submits the clicked suggestion', async () => {
    const playAction = vi.fn().mockResolvedValue(undefined);
    useGameStore.setState((current) => ({
      playAction,
      currentStory: current.currentStory
        ? {
            ...current.currentStory,
            turns: [
              {
                ...current.currentStory.turns[0],
                choicePoint: 'A. 追问守夜人。 B. 检查银色徽章。'
              }
            ]
          }
        : undefined
    }));
    const user = userEvent.setup();

    render(<GameReaderPage storyId="story-1" />);

    const actionArea = screen.getByRole('region', { name: '行动输入' });
    expect(screen.getByRole('checkbox', { name: '显示行动建议' })).toBeInTheDocument();
    expect(actionArea).toContainElement(screen.getByRole('checkbox', { name: '显示行动建议' }));
    expect(screen.queryByRole('button', { name: '追问守夜人。' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: '显示行动建议' }));

    await user.click(screen.getByRole('button', { name: '追问守夜人。' }));

    expect(playAction).toHaveBeenCalledWith('追问守夜人。');
  });

  it('hides action input and choice suggestions after the final turn', () => {
    useGameStore.setState((current) => ({
      currentStory: current.currentStory
        ? {
            ...current.currentStory,
            state: {
              ...current.currentStory.state,
              turn: 15,
              maxTurns: 15,
              isEnded: true
            }
          }
        : undefined
    }));

    render(<GameReaderPage storyId="story-1" />);

    expect(screen.queryByLabelText('输入你的行动')).not.toBeInTheDocument();
    expect(screen.queryByText('你要怎么做？')).not.toBeInTheDocument();
    expect(screen.getByText('故事已完结')).toBeInTheDocument();
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
