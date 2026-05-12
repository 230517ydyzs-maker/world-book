import { create } from 'zustand';
import { callAiModel } from '../game/aiClient';
import { createStoryFromInput, playActionTurn, type AiRunner, type CreateStoryInput } from '../game/storyEngine';
import type { SavedStory } from '../game/types';
import { getStory, saveStory } from '../storage/saveStore';

interface GameStore {
  currentStory?: SavedStory;
  isLoading: boolean;
  error?: string;
  createStory: (input: CreateStoryInput, runner?: AiRunner) => Promise<void>;
  loadStory: (storyId: string) => Promise<void>;
  playAction: (action: string, runner?: AiRunner) => Promise<void>;
  clearError: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentStory: undefined,
  isLoading: false,
  error: undefined,
  async createStory(input, runner) {
    set({ isLoading: true, error: undefined });
    try {
      const aiRunner: AiRunner =
        runner ?? ((messages) => callAiModel({ baseUrl: input.baseUrl, apiKey: input.apiKey, model: input.model }, messages));
      const story = await createStoryFromInput(input, aiRunner);
      await saveStory(story);
      set({ currentStory: story, isLoading: false });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
    }
  },
  async loadStory(storyId) {
    set({ isLoading: true, error: undefined });
    try {
      const story = await getStory(storyId);
      if (!story) throw new Error('未找到故事存档');
      set({ currentStory: story, isLoading: false });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
    }
  },
  async playAction(action, runner) {
    const story = get().currentStory;
    if (!story) {
      set({ error: '没有正在进行的故事' });
      return;
    }
    set({ isLoading: true, error: undefined });
    try {
      const aiRunner: AiRunner = runner ?? ((messages) => callAiModel(story.config.modelConfig, messages));
      const next = await playActionTurn(story, action, aiRunner);
      await saveStory(next);
      set({ currentStory: next, isLoading: false });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
    }
  },
  clearError() {
    set({ error: undefined });
  }
}));
