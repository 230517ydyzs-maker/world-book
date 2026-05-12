import { FormEvent, useEffect, useState } from 'react';
import ModelConfigForm from '../components/ModelConfigForm';
import { useGameStore } from '../store/useGameStore';

const defaults = {
  title: '雨夜钟楼',
  genre: '悬疑',
  style: '严肃短篇',
  worldSetting: '一座被雨季封锁的旧城，钟楼每晚零点会响起不存在的第十三声钟。',
  rulesText: '普通人不能施法\n午夜钟声会改变部分记忆',
  characterName: '林舟',
  characterIdentity: '档案修复师',
  characterGoal: '查清父亲失踪真相',
  abilitiesText: '观察\n推理\n档案修复',
  weaknessesText: '体力较弱',
  baseUrl: 'https://api.example.com/v1',
  apiKey: '',
  model: 'your-model-name'
};

export default function CreateStoryPage() {
  const [form, setForm] = useState(defaults);
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
    await createStory(form);
  }

  return (
    <main className="page page-narrow create-page">
      <p className="eyebrow">故事生成器</p>
      <h1>创建一本新的小说</h1>
      <p className="lede">完成故事、角色和模型配置后，进入独立的游戏阅读页面。</p>

      <form className="panel form-grid" onSubmit={submit}>
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
          世界观设定
          <textarea value={form.worldSetting} onChange={(event) => update('worldSetting', event.target.value)} required />
        </label>
        <label>
          世界规则
          <textarea value={form.rulesText} onChange={(event) => update('rulesText', event.target.value)} />
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

        <ModelConfigForm
          baseUrl={form.baseUrl}
          apiKey={form.apiKey}
          model={form.model}
          onChange={update}
        />

        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={isLoading}>{isLoading ? '生成中...' : '进入故事'}</button>
      </form>
    </main>
  );
}
