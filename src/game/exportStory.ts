import type { SavedStory } from './types';

export function buildStoryExportText(story: SavedStory): string {
  const header = [
    story.config.title,
    '',
    `题材：${story.config.genre}`,
    `风格：${story.config.style}`,
    `主角：${story.config.playerCharacter.name}，${story.config.playerCharacter.identity}`,
    ''
  ].join('\n');

  const body = story.turns
    .map((turn) => [turn.storyText, ''].join('\n'))
    .join('\n');

  return `${header}${body}`.trimEnd();
}
