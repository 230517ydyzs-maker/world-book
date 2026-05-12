import type { TurnLog } from '../game/types';

interface NovelViewProps {
  title: string;
  turns: TurnLog[];
}

export default function NovelView({ title, turns }: NovelViewProps) {
  return (
    <article className="novel">
      <h1>{title}</h1>
      {turns.map((turn, index) => (
        <section key={`${turn.turn}-${index}`} className="turn-section">
          <p>{turn.storyText}</p>
          <div className="choice-point">{turn.choicePoint}</div>
        </section>
      ))}
    </article>
  );
}
