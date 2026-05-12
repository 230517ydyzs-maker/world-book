import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateStoryPage from './CreateStoryPage';
import { useGameStore } from '../store/useGameStore';

describe('CreateStoryPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentStory: undefined,
      isLoading: false,
      error: undefined
    });
  });

  it('submits story creation input to the store', async () => {
    const createStory = vi.fn().mockResolvedValue(undefined);
    useGameStore.setState({ createStory });
    const user = userEvent.setup();

    render(<CreateStoryPage />);

    await user.clear(screen.getByLabelText('故事标题'));
    await user.type(screen.getByLabelText('故事标题'), '雨夜钟楼');
    await user.click(screen.getByRole('button', { name: '进入故事' }));

    expect(createStory).toHaveBeenCalledWith(expect.objectContaining({
      title: '雨夜钟楼',
      genre: expect.any(String),
      baseUrl: expect.any(String),
      model: expect.any(String)
    }));
  });
});
