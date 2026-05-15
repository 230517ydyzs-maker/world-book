import { FormEvent, useState } from 'react';

interface ActionInputProps {
  disabled: boolean;
  choicePoint?: string;
  showChoiceSuggestions: boolean;
  onToggleChoiceSuggestions: (show: boolean) => void;
  onSubmit: (action: string) => void;
}

function parseChoiceSuggestions(choicePoint?: string): string[] {
  const text = choicePoint?.trim();
  if (!text) return [];

  const normalized = text.replace(/\r?\n/g, ' ');
  const labeledChoices = normalized
    .split(/(?:^|\s+)(?:[A-Ca-c]|[1-3]|[一二三])[\.\、．:：]\s*/g)
    .map((choice) => choice.trim())
    .filter(Boolean);

  if (labeledChoices.length > 1) {
    return labeledChoices;
  }

  return normalized
    .split(/[；;]\s*/g)
    .map((choice) => choice.trim())
    .filter(Boolean);
}

export default function ActionInput({
  disabled,
  choicePoint,
  showChoiceSuggestions,
  onToggleChoiceSuggestions,
  onSubmit
}: ActionInputProps) {
  const [value, setValue] = useState('');
  const suggestions = parseChoiceSuggestions(choicePoint);

  function submit(event: FormEvent) {
    event.preventDefault();
    const action = value.trim();
    if (!action) return;
    onSubmit(action);
    setValue('');
  }

  function submitSuggestion(action: string) {
    if (disabled) return;
    onSubmit(action);
  }

  return (
    <section className="action-panel" aria-label="行动输入">
      <div className="action-input-row">
        <form className="action-input" onSubmit={submit}>
          <label className="sr-only" htmlFor="player-action">输入你的行动</label>
          <input
            id="player-action"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="输入你的行动..."
            disabled={disabled}
          />
          <button type="submit" disabled={disabled}>{disabled ? '生成中...' : '发送'}</button>
        </form>
        <label className="inline-toggle action-suggestion-toggle">
          <input
            type="checkbox"
            checked={showChoiceSuggestions}
            onChange={(event) => onToggleChoiceSuggestions(event.target.checked)}
            disabled={disabled || suggestions.length === 0}
          />
          显示行动建议
        </label>
      </div>

      {showChoiceSuggestions && suggestions.length > 0 ? (
        <div className="choice-suggestion-list" aria-label="行动建议">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="choice-suggestion"
              onClick={() => submitSuggestion(suggestion)}
              disabled={disabled}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
