import { FormEvent, useState } from 'react';

interface ActionInputProps {
  disabled: boolean;
  onSubmit: (action: string) => void;
}

export default function ActionInput({ disabled, onSubmit }: ActionInputProps) {
  const [value, setValue] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const action = value.trim();
    if (!action) return;
    onSubmit(action);
    setValue('');
  }

  return (
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
  );
}
