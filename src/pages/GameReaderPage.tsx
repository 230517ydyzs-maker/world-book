import { useEffect } from 'react';
import ActionInput from '../components/ActionInput';
import ErrorNotice from '../components/ErrorNotice';
import ExportStoryButton from '../components/ExportStoryButton';
import NovelView from '../components/NovelView';
import SidebarStatePanel from '../components/SidebarStatePanel';
import { useGameStore } from '../store/useGameStore';

interface GameReaderPageProps {
  storyId: string;
}

export default function GameReaderPage({ storyId }: GameReaderPageProps) {
  const { currentStory, isLoading, error, loadStory, playAction } = useGameStore();

  useEffect(() => {
    if (!currentStory || currentStory.config.id !== storyId) {
      void loadStory(storyId);
    }
  }, [currentStory, loadStory, storyId]);

  if (!currentStory) {
    return <main className="page">正在读取故事...</main>;
  }

  return (
    <div className="reader-page">
      <header className="topbar">
        <div className="topbar-title">{currentStory.config.title}</div>
        <div className="topbar-actions">
          <span>第 {currentStory.state.turn} / {currentStory.state.maxTurns} 回合</span>
          <ExportStoryButton story={currentStory} />
        </div>
      </header>
      <div className="reader-layout">
        <main className="reader-main">
          <NovelView title={currentStory.config.title} turns={currentStory.turns} />
          <ErrorNotice message={error} />
          <ActionInput disabled={isLoading || currentStory.state.isEnded} onSubmit={playAction} />
        </main>
        <SidebarStatePanel
          character={currentStory.config.playerCharacter}
          rules={currentStory.config.rules}
          state={currentStory.state}
        />
      </div>
    </div>
  );
}
