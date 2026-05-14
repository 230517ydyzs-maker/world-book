import type { TurnLog } from '../game/types';

interface NovelViewProps {
  title: string;
  turns: TurnLog[];
  showChoiceSuggestions: boolean;
}

export default function NovelView({ title, turns, showChoiceSuggestions }: NovelViewProps) {
  return (
    <article className="novel">
      <h1>{title}</h1>
      {turns.map((turn, index) => (
        <section key={`${turn.turn}-${index}`} className="turn-section">
          <p>{turn.storyText}</p>
          {showChoiceSuggestions && turn.choicePoint ? (
            <div className="choice-point">{turn.choicePoint}</div>
          ) : null}
        </section>
      ))}
    </article>
  );
}
