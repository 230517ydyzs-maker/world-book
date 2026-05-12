import type { SavedStory } from '../game/types';
import { clearRecords, getAllRecords, getRecord, putRecord } from './indexedDb';

export interface StoryListItem {
  id: string;
  title: string;
  turn: number;
  maxTurns: number;
  isEnded: boolean;
  updatedAt: string;
}

export async function saveStory(story: SavedStory): Promise<void> {
  await putRecord<SavedStory>({
    id: story.config.id,
    value: story,
    updatedAt: new Date().toISOString()
  });
  localStorage.setItem('story-generator:lastStoryId', story.config.id);
}

export async function getStory(id: string): Promise<SavedStory | undefined> {
  return (await getRecord<SavedStory>(id))?.value;
}

export async function listStories(): Promise<StoryListItem[]> {
  const records = await getAllRecords<SavedStory>();

  return records
    .map((record) => ({
      id: record.value.config.id,
      title: record.value.config.title,
      turn: record.value.state.turn,
      maxTurns: record.value.state.maxTurns,
      isEnded: record.value.state.isEnded,
      updatedAt: record.updatedAt
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLastStoryId(): string | null {
  return localStorage.getItem('story-generator:lastStoryId');
}

export async function clearAllStories(): Promise<void> {
  localStorage.removeItem('story-generator:lastStoryId');
  await clearRecords();
}
