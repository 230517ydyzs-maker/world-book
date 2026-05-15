interface ModelConfigFormProps {
  baseUrl: string;
  apiKey: string;
  model: string;
  onChange: (field: 'baseUrl' | 'apiKey' | 'model', value: string) => void;
  onClearSaved?: () => void;
}

export default function ModelConfigForm({ baseUrl, apiKey, model, onChange, onClearSaved }: ModelConfigFormProps) {
  return (
    <section className="form-section">
      <h2>AI 模型配置</h2>
      <label>
        Base URL
        <input value={baseUrl} placeholder="必填" onChange={(event) => onChange('baseUrl', event.target.value)} required />
      </label>
      <label>
        模型名
        <input value={model} placeholder="必填" onChange={(event) => onChange('model', event.target.value)} required />
      </label>
      <label>
        API Key
        <input type="password" value={apiKey} placeholder="必填" onChange={(event) => onChange('apiKey', event.target.value)} required />
      </label>
      {onClearSaved ? (
        <button type="button" className="secondary-button" onClick={onClearSaved}>
          清除已保存配置
        </button>
      ) : null}
    </section>
  );
}
