interface ModelConfigFormProps {
  baseUrl: string;
  apiKey: string;
  model: string;
  onChange: (field: 'baseUrl' | 'apiKey' | 'model', value: string) => void;
}

export default function ModelConfigForm({ baseUrl, apiKey, model, onChange }: ModelConfigFormProps) {
  return (
    <section className="form-section">
      <h2>AI 模型配置</h2>
      <label>
        Base URL
        <input value={baseUrl} onChange={(event) => onChange('baseUrl', event.target.value)} />
      </label>
      <label>
        模型名
        <input value={model} onChange={(event) => onChange('model', event.target.value)} />
      </label>
      <label>
        API Key
        <input type="password" value={apiKey} onChange={(event) => onChange('apiKey', event.target.value)} />
      </label>
    </section>
  );
}
