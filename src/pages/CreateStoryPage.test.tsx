import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateStoryPage from './CreateStoryPage';
import { useGameStore } from '../store/useGameStore';
import { listStories } from '../storage/saveStore';

vi.mock('../storage/saveStore', () => ({
  listStories: vi.fn()
}));

describe('CreateStoryPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useGameStore.setState({
      currentStory: undefined,
      isLoading: false,
      error: undefined
    });
    vi.mocked(listStories).mockResolvedValue([]);
  });

  it('submits story creation input to the store', async () => {
    const createStory = vi.fn().mockResolvedValue(undefined);
    useGameStore.setState({ createStory });
    const user = userEvent.setup();

    render(<CreateStoryPage />);

    expect(screen.getByLabelText('故事标题')).toHaveValue('');

    await user.type(screen.getByLabelText('故事标题'), '雨夜钟楼');
    await user.type(screen.getByLabelText('题材'), '悬疑');
    await user.type(screen.getByLabelText('风格'), '严肃短篇');
    await user.type(screen.getByLabelText('世界观设定'), '一座被雨季封锁的旧城。');
    await user.type(screen.getByLabelText('角色名字'), '林舟');
    await user.type(screen.getByLabelText('角色身份'), '档案修复师');
    await user.type(screen.getByLabelText('角色目标'), '查清父亲失踪真相');
    await user.type(screen.getByLabelText('Base URL'), 'https://api.example.com/v1');
    await user.type(screen.getByLabelText('模型名'), 'test-model');
    await user.type(screen.getByLabelText('API Key'), 'sk-test');
    await user.click(screen.getByRole('button', { name: '进入故事' }));

    expect(createStory).toHaveBeenCalledWith(expect.objectContaining({
      title: '雨夜钟楼',
      genre: '悬疑',
      baseUrl: 'https://api.example.com/v1',
      model: 'test-model'
    }));
  });

  it('remembers the last AI model config and can clear it', async () => {
    const createStory = vi.fn().mockResolvedValue(undefined);
    useGameStore.setState({ createStory });
    const user = userEvent.setup();

    render(<CreateStoryPage />);

    await user.type(screen.getByLabelText('故事标题'), '雨夜钟楼');
    await user.type(screen.getByLabelText('题材'), '悬疑');
    await user.type(screen.getByLabelText('风格'), '严肃短篇');
    await user.type(screen.getByLabelText('世界观设定'), '一座被雨季封锁的旧城。');
    await user.type(screen.getByLabelText('角色名字'), '林舟');
    await user.type(screen.getByLabelText('角色身份'), '档案修复师');
    await user.type(screen.getByLabelText('角色目标'), '查清父亲失踪真相');
    await user.type(screen.getByLabelText('Base URL'), 'https://api.example.com/v1');
    await user.type(screen.getByLabelText('模型名'), 'test-model');
    await user.type(screen.getByLabelText('API Key'), 'sk-test');
    await user.click(screen.getByRole('button', { name: '进入故事' }));

    expect(window.localStorage.getItem('worldbook:model-config')).toContain('test-model');

    render(<CreateStoryPage />);

    expect(screen.getAllByLabelText('Base URL').at(-1)).toHaveValue('https://api.example.com/v1');
    expect(screen.getAllByLabelText('模型名').at(-1)).toHaveValue('test-model');
    expect(screen.getAllByLabelText('API Key').at(-1)).toHaveValue('sk-test');

    await user.click(screen.getAllByRole('button', { name: '清除已保存配置' }).at(-1)!);

    expect(window.localStorage.getItem('worldbook:model-config')).toBeNull();
    expect(screen.getAllByLabelText('Base URL').at(-1)).toHaveValue('');
    expect(screen.getAllByLabelText('模型名').at(-1)).toHaveValue('');
    expect(screen.getAllByLabelText('API Key').at(-1)).toHaveValue('');
  });

  it('lists local saves and opens the selected story', async () => {
    vi.mocked(listStories).mockResolvedValue([
      {
        id: 'story-1',
        title: '雨夜钟楼',
        turn: 3,
        maxTurns: 15,
        isEnded: false,
        updatedAt: '2026-05-12T00:00:00.000Z'
      },
      {
        id: 'story-2',
        title: '勇者斗恶龙',
        turn: 15,
        maxTurns: 15,
        isEnded: true,
        updatedAt: '2026-05-11T00:00:00.000Z'
      }
    ]);
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { assign },
      writable: true
    });
    const user = userEvent.setup();

    render(<CreateStoryPage />);

    await user.click(screen.getByRole('button', { name: '读取存档' }));

    expect(await screen.findByText('雨夜钟楼')).toBeInTheDocument();
    expect(screen.getByText('第 3 / 15 回合')).toBeInTheDocument();
    expect(screen.getByText('勇者斗恶龙')).toBeInTheDocument();
    expect(screen.getByText(/已完结/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '读取 雨夜钟楼' }));

    expect(assign).toHaveBeenCalledWith('/play/story-1');
  });

  it('toggles the local save list from the load save button', async () => {
    vi.mocked(listStories).mockResolvedValue([
      {
        id: 'story-1',
        title: '雨夜钟楼',
        turn: 3,
        maxTurns: 15,
        isEnded: false,
        updatedAt: '2026-05-12T00:00:00.000Z'
      }
    ]);
    const user = userEvent.setup();

    render(<CreateStoryPage />);

    const toggleButton = screen.getByRole('button', { name: '读取存档' });
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('本地存档')).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(await screen.findByLabelText('本地存档')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收起存档' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: '收起存档' }));

    expect(screen.queryByLabelText('本地存档')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '读取存档' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('groups story and character fields in the first column and the rest in the second column', () => {
    render(<CreateStoryPage />);

    const storyColumn = screen.getByRole('group', { name: '故事与角色' });
    const worldColumn = screen.getByRole('group', { name: '世界与模型' });

    for (const label of ['故事标题', '题材', '风格', '角色名字', '角色身份', '角色目标', '能力', '弱点']) {
      expect(storyColumn).toContainElement(screen.getByLabelText(label));
    }

    for (const label of ['世界观设定', '世界规则', 'Base URL', '模型名', 'API Key']) {
      expect(worldColumn).toContainElement(screen.getByLabelText(label));
    }
  });

  it('requires core story, character, and AI model fields with short in-place hints', () => {
    render(<CreateStoryPage />);

    const requiredLabels = ['故事标题', '题材', '风格', '角色名字', '角色身份', 'Base URL', '模型名', 'API Key'];
    const optionalLabels = ['角色目标', '能力', '弱点', '世界观设定', '世界规则'];

    for (const label of requiredLabels) {
      const field = screen.getByLabelText(label);
      expect(field).toBeRequired();
      expect(field).toHaveAttribute('placeholder', '必填');
    }

    for (const label of optionalLabels) {
      const field = screen.getByLabelText(label);
      expect(field).not.toBeRequired();
    }
  });
});
