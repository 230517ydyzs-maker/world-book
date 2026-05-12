import { buildStoryExportText } from '../game/exportStory';
import type { SavedStory } from '../game/types';

interface ExportStoryButtonProps {
  story: SavedStory;
}

export default function ExportStoryButton({ story }: ExportStoryButtonProps) {
  function exportStory() {
    const blob = new Blob([buildStoryExportText(story)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${story.config.title || 'story'}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className="secondary-button" onClick={exportStory}>
      导出故事
    </button>
  );
}
