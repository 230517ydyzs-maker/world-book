import { FormEvent, useEffect, useState } from 'react';
import ModelConfigForm from '../components/ModelConfigForm';
import { useGameStore } from '../store/useGameStore';
import { listStories, type StoryListItem } from '../storage/saveStore';

const savedModelConfigKey = 'worldbook:model-config';

const defaults = {
  title: '',
  genre: '',
  style: '',
  worldSetting: '',
  rulesText: '',
  characterName: '',
  characterIdentity: '',
  characterGoal: '',
  abilitiesText: '',
  weaknessesText: '',
  baseUrl: '',
  apiKey: '',
  model: ''
};

type ModelConfigFields = Pick<typeof defaults, 'baseUrl' | 'apiKey' | 'model'>;

function loadSavedModelConfig(): ModelConfigFields {
  try {
    const savedConfig = window.localStorage.getItem(savedModelConfigKey);
    if (!savedConfig) {
      return { baseUrl: '', apiKey: '', model: '' };
    }

    const parsed = JSON.parse(savedConfig) as Partial<ModelConfigFields>;
    return {
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' ? parsed.model : ''
    };
  } catch {
    return { baseUrl: '', apiKey: '', model: '' };
  }
}

function saveModelConfig(config: ModelConfigFields) {
  window.localStorage.setItem(savedModelConfigKey, JSON.stringify(config));
}

export default function CreateStoryPage() {
  const [form, setForm] = useState(() => ({ ...defaults, ...loadSavedModelConfig() }));
  const [saves, setSaves] = useState<StoryListItem[]>([]);
  const [isSaveListOpen, setIsSaveListOpen] = useState(false);
  const [saveListError, setSaveListError] = useState<string>();
  const { createStory, isLoading, error, currentStory } = useGameStore();

  useEffect(() => {
    if (currentStory) {
      window.location.assign(`/play/${currentStory.config.id}`);
    }
  }, [currentStory]);

  function update(field: keyof typeof defaults, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    saveModelConfig({
      baseUrl: form.baseUrl,
      apiKey: form.apiKey,
      model: form.model
    });
    await createStory(form);
  }

  async function toggleSaveList() {
    if (isSaveListOpen) {
      setIsSaveListOpen(false);
      return;
    }

    setIsSaveListOpen(true);
    setSaveListError(undefined);
    try {
      setSaves(await listStories());
    } catch {
      setSaveListError('读取本地存档失败');
    }
  }

  function openStory(storyId: string) {
    window.location.assign(`/play/${storyId}`);
  }

  function clearSavedModelConfig() {
    window.localStorage.removeItem(savedModelConfigKey);
    setForm((current) => ({
      ...current,
      baseUrl: '',
      apiKey: '',
      model: ''
    }));
  }

  return (
    <main className="page page-narrow create-page">
      <p className="eyebrow">故事生成器</p>
      <h1>创建一本新的小说</h1>
      <p className="lede">完成故事、角色和模型配置后，进入独立的游戏阅读页面。</p>
      <div className="page-actions">
        <button
          type="button"
          className="secondary-button"
          aria-expanded={isSaveListOpen}
          aria-controls="local-save-list"
          onClick={toggleSaveList}
        >
          {isSaveListOpen ? '收起存档' : '读取存档'}
        </button>
      </div>

      {isSaveListOpen ? (
        <section id="local-save-list" className="panel save-list" aria-label="本地存档">
          <h2>本地存档</h2>
          {saveListError ? <p className="error">{saveListError}</p> : null}
          {!saveListError && saves.length === 0 ? <p>暂无存档</p> : null}
          {saves.map((save) => (
            <article key={save.id} className="save-list-item">
              <div>
                <strong>{save.title}</strong>
                <p>第 {save.turn} / {save.maxTurns} 回合</p>
                <p>{save.isEnded ? '已完结' : '进行中'} · {new Date(save.updatedAt).toLocaleString()}</p>
              </div>
              <button type="button" className="secondary-button" onClick={() => openStory(save.id)}>
                读取 {save.title}
              </button>
            </article>
          ))}
        </section>
      ) : null}

      <form className="panel form-grid" onSubmit={submit}>
        <fieldset className="form-column" aria-label="故事与角色">
          <legend>故事与角色</legend>
          <label>
            故事标题
            <input value={form.title} onChange={(event) => update('title', event.target.value)} required />
          </label>
          <label>
            题材
            <input value={form.genre} onChange={(event) => update('genre', event.target.value)} required />
          </label>
          <label>
            风格
            <input value={form.style} onChange={(event) => update('style', event.target.value)} required />
          </label>
          <label>
            角色名字
            <input value={form.characterName} onChange={(event) => update('characterName', event.target.value)} required />
          </label>
          <label>
            角色身份
            <input value={form.characterIdentity} onChange={(event) => update('characterIdentity', event.target.value)} required />
          </label>
          <label>
            角色目标
            <input value={form.characterGoal} onChange={(event) => update('characterGoal', event.target.value)} required />
          </label>
          <label>
            能力
            <textarea value={form.abilitiesText} onChange={(event) => update('abilitiesText', event.target.value)} />
          </label>
          <label>
            弱点
            <textarea value={form.weaknessesText} onChange={(event) => update('weaknessesText', event.target.value)} />
          </label>
        </fieldset>

        <fieldset className="form-column" aria-label="世界与模型">
          <legend>世界与模型</legend>
          <label>
            世界观设定
            <textarea value={form.worldSetting} onChange={(event) => update('worldSetting', event.target.value)} required />
          </label>
          <label>
            世界规则
            <textarea value={form.rulesText} onChange={(event) => update('rulesText', event.target.value)} />
          </label>

          <ModelConfigForm
            baseUrl={form.baseUrl}
            apiKey={form.apiKey}
            model={form.model}
            onChange={update}
            onClearSaved={clearSavedModelConfig}
          />
        </fieldset>

        <div className="form-submit-row">
          {error ? <p className="error">{error}</p> : null}
          <button type="submit" disabled={isLoading}>{isLoading ? '生成中...' : '进入故事'}</button>
        </div>
      </form>
    </main>
  );
}
