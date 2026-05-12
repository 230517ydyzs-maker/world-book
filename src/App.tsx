import CreateStoryPage from './pages/CreateStoryPage';
import GameReaderPage from './pages/GameReaderPage';

function getRoute() {
  const path = window.location.pathname;
  if (path.startsWith('/play/')) {
    return { name: 'play' as const, storyId: decodeURIComponent(path.replace('/play/', '')) };
  }
  return { name: 'create' as const };
}

export default function App() {
  const route = getRoute();

  if (route.name === 'play') {
    return <GameReaderPage storyId={route.storyId} />;
  }

  return <CreateStoryPage />;
}
