interface GameReaderPageProps {
  storyId: string;
}

export default function GameReaderPage({ storyId }: GameReaderPageProps) {
  return (
    <main className="page">
      <h1>游戏阅读</h1>
      <p>故事 ID：{storyId}</p>
    </main>
  );
}
