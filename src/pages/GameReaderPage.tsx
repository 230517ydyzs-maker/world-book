import { useEffect, useState } from 'react';
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
  const [showChoiceSuggestions, setShowChoiceSuggestions] = useState(false);

  useEffect(() => {
    if (!currentStory || currentStory.config.id !== storyId) {
      void loadStory(storyId);
    }
  }, [currentStory, loadStory, storyId]);

  if (!currentStory) {
    return <main className="page">正在读取故事...</main>;
  }

  function returnToCreate() {
    window.location.assign('/create');
  }

  return (
    <div className="reader-page">
      <header className="topbar">
        <div className="topbar-title">{currentStory.config.title}</div>
        <div className="topbar-actions">
          <button type="button" className="secondary-button" onClick={returnToCreate}>
            返回创建
          </button>
          <span>第 {currentStory.state.turn} / {currentStory.state.maxTurns} 回合</span>
          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={showChoiceSuggestions}
              onChange={(event) => setShowChoiceSuggestions(event.target.checked)}
            />
            显示行动建议
          </label>
          <ExportStoryButton story={currentStory} />
        </div>
      </header>
      <div className="reader-layout">
        <SidebarStatePanel
          side="left"
          character={currentStory.config.playerCharacter}
          worldSetting={currentStory.config.worldSetting}
          rules={currentStory.config.rules}
          state={currentStory.state}
        />
        <main className="reader-main">
          <NovelView
            title={currentStory.config.title}
            turns={currentStory.turns}
            showChoiceSuggestions={showChoiceSuggestions && !currentStory.state.isEnded}
          />
          <ErrorNotice message={error} />
          {currentStory.state.isEnded ? (
            <p className="ending-note">故事已完结</p>
          ) : (
            <ActionInput disabled={isLoading} onSubmit={playAction} />
          )}
        </main>
        <SidebarStatePanel
          side="right"
          character={currentStory.config.playerCharacter}
          worldSetting={currentStory.config.worldSetting}
          rules={currentStory.config.rules}
          state={currentStory.state}
        />
      </div>
    </div>
  );
}
