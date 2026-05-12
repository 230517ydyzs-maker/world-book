# Story Generator MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable web MVP of Story Generator with a separate story creation page, a separate game reader page, player-supplied AI model configuration, local saves, AI action adjudication, story continuation, and export.

**Architecture:** Use a React + TypeScript + Vite single page app with two routes: `/create` and `/play/:storyId`. Keep game logic in `src/game`, persistence in `src/storage`, and UI in `src/pages` plus focused components. The AI client uses an OpenAI-compatible request shape behind a small interface so browser direct calls can later be replaced by a Tauri local proxy.

**Tech Stack:** React, TypeScript, Vite, Zustand, IndexedDB, Vitest, React Testing Library, native Fetch, CSS Modules or plain CSS.

---

## File Structure

- Create `package.json`: scripts, runtime dependencies, dev dependencies.
- Create `index.html`: Vite entry shell.
- Create `vite.config.ts`: React and Vitest config.
- Create `tsconfig.json` and `tsconfig.node.json`: TypeScript config.
- Create `src/main.tsx`: React entrypoint.
- Create `src/App.tsx`: route selection and app shell.
- Create `src/styles.css`: global minimal UI styling.
- Create `src/game/types.ts`: shared story, state, turn, model, and AI response types.
- Create `src/game/id.ts`: deterministic ID helper for stories and turns.
- Create `src/game/promptBuilder.ts`: prompt construction for opening generation and action turns.
- Create `src/game/aiClient.ts`: OpenAI-compatible API client and response parser.
- Create `src/game/stateReducer.ts`: apply AI state patches to `GameState`.
- Create `src/game/storyEngine.ts`: orchestrates create story, opening turn, action turn, rejected actions, endings.
- Create `src/storage/indexedDb.ts`: IndexedDB wrapper.
- Create `src/storage/saveStore.ts`: persistence facade used by UI and engine.
- Create `src/store/useGameStore.ts`: Zustand state and async actions.
- Create `src/pages/CreateStoryPage.tsx`: independent story creation page.
- Create `src/pages/GameReaderPage.tsx`: independent game reader page.
- Create `src/components/ModelConfigForm.tsx`: model config fields.
- Create `src/components/NovelView.tsx`: chapter-like prose rendering.
- Create `src/components/ActionInput.tsx`: bottom action input.
- Create `src/components/SidebarStatePanel.tsx`: character, NPC, clues, rules, progress.
- Create `src/components/ErrorNotice.tsx`: retryable error display.
- Create `src/components/ExportStoryButton.tsx`: export full story text.
- Create tests next to code as `*.test.ts` or `*.test.tsx`.

---

### Task 1: Project Scaffold and Test Harness

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Create the package manifest**

Create `package.json`:

```json
{
  "name": "story-generator",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "vite": "^6.0.0",
    "typescript": "^5.6.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create Vite and TypeScript config**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>故事生成器</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true
  }
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create the first failing app smoke test**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
```

Create `src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the create story entry by default', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '创建一本新的小说' })).toBeInTheDocument();
    expect(screen.getByLabelText('故事标题')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm install`

Expected: dependencies install successfully.

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because `src/App.tsx` does not exist.

- [ ] **Step 5: Implement minimal app shell**

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="page page-narrow">
      <p className="eyebrow">故事生成器</p>
      <h1>创建一本新的小说</h1>
      <label htmlFor="title">故事标题</label>
      <input id="title" name="title" />
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #20201d;
  background: #f7f7f5;
  font-family: Inter, "Segoe UI", "Microsoft YaHei", Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background: #f7f7f5;
}

button,
input,
textarea {
  font: inherit;
}

.page {
  width: min(1180px, calc(100vw - 48px));
  margin: 42px auto;
}

.page-narrow {
  width: min(760px, calc(100vw - 48px));
}

.eyebrow {
  color: #73736d;
  font-size: 14px;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit scaffold**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src
git commit -m "chore: scaffold story generator app"
```

---

### Task 2: Core Domain Types and State Reducer

**Files:**
- Create: `src/game/types.ts`
- Create: `src/game/id.ts`
- Create: `src/game/stateReducer.ts`
- Create: `src/game/stateReducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

Create `src/game/stateReducer.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { applyStatePatch, createInitialGameState } from './stateReducer';
import type { AiStatePatch, StoryConfig } from './types';

const story: StoryConfig = {
  id: 'story-1',
  title: '雨夜钟楼',
  genre: '悬疑',
  style: '严肃短篇',
  worldSetting: '旧城钟楼每晚响起第十三声钟。',
  rules: ['普通人不能施法'],
  playerCharacter: {
    name: '林舟',
    identity: '档案修复师',
    goal: '查清父亲失踪真相',
    abilities: ['观察', '推理'],
    weaknesses: ['体力较弱']
  },
  modelConfig: {
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    model: 'test-model'
  },
  createdAt: '2026-05-12T00:00:00.000Z'
};

describe('stateReducer', () => {
  it('creates the initial short-story game state', () => {
    const state = createInitialGameState(story, 15);

    expect(state.storyId).toBe('story-1');
    expect(state.turn).toBe(0);
    expect(state.maxTurns).toBe(15);
    expect(state.dangerLevel).toBe('low');
    expect(state.endingProgress).toBe(0);
  });

  it('applies AI state patches without duplicating clues or rules', () => {
    const state = createInitialGameState(story, 15);
    const patch: AiStatePatch = {
      currentLocation: '旧城钟楼',
      dangerLevel: 'medium',
      endingProgressDelta: 0.2,
      playerStatusAdded: ['紧张'],
      cluesAdded: ['银色徽章', '银色徽章'],
      worldMemoryAdded: ['守夜人知道旧案'],
      npcUpdates: [
        {
          name: '守夜人',
          attitude: '戒备',
          knownFacts: ['知道主角父亲']
        }
      ]
    };

    const next = applyStatePatch(state, patch);

    expect(next.currentLocation).toBe('旧城钟楼');
    expect(next.dangerLevel).toBe('medium');
    expect(next.endingProgress).toBe(0.2);
    expect(next.playerStatus).toEqual(['紧张']);
    expect(next.clues).toEqual(['银色徽章']);
    expect(next.worldMemory).toEqual(['守夜人知道旧案']);
    expect(next.npcRegistry).toEqual([
      {
        name: '守夜人',
        attitude: '戒备',
        knownFacts: ['知道主角父亲']
      }
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/game/stateReducer.test.ts`

Expected: FAIL because `src/game/stateReducer.ts` and `src/game/types.ts` do not exist.

- [ ] **Step 3: Define domain types**

Create `src/game/types.ts`:

```ts
export type DangerLevel = 'low' | 'medium' | 'high';

export type Verdict = 'allowed' | 'allowed_with_cost' | 'failed_forward' | 'rejected';

export interface ModelConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface PlayerCharacter {
  name: string;
  identity: string;
  goal: string;
  abilities: string[];
  weaknesses: string[];
}

export interface StoryConfig {
  id: string;
  title: string;
  genre: string;
  style: string;
  worldSetting: string;
  rules: string[];
  playerCharacter: PlayerCharacter;
  modelConfig: ModelConfig;
  createdAt: string;
}

export interface NpcRecord {
  name: string;
  attitude: string;
  knownFacts: string[];
}

export interface GameState {
  storyId: string;
  turn: number;
  maxTurns: number;
  currentLocation: string;
  dangerLevel: DangerLevel;
  endingProgress: number;
  playerStatus: string[];
  npcRegistry: NpcRecord[];
  clues: string[];
  worldMemory: string[];
  isEnded: boolean;
}

export interface AiStatePatch {
  currentLocation?: string;
  dangerLevel?: DangerLevel;
  endingProgressDelta?: number;
  playerStatusAdded?: string[];
  playerStatusRemoved?: string[];
  cluesAdded?: string[];
  worldMemoryAdded?: string[];
  npcUpdates?: NpcRecord[];
}

export interface TurnLog {
  storyId: string;
  turn: number;
  playerAction: string;
  verdict: Verdict;
  verdictReason: string;
  storyText: string;
  choicePoint: string;
  statePatch: AiStatePatch;
  createdAt: string;
}

export interface AiTurnResponse {
  verdict: Verdict;
  verdict_reason: string;
  story_text: string;
  choice_point: string;
  state_patch: AiStatePatch;
}

export interface SavedStory {
  config: StoryConfig;
  state: GameState;
  turns: TurnLog[];
}
```

Create `src/game/id.ts`:

```ts
export function createId(prefix: string): string {
  const randomPart = crypto.getRandomValues(new Uint32Array(2)).join('');
  return `${prefix}-${Date.now()}-${randomPart}`;
}
```

- [ ] **Step 4: Implement state reducer**

Create `src/game/stateReducer.ts`:

```ts
import type { AiStatePatch, GameState, NpcRecord, StoryConfig } from './types';

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function mergeNpcRecords(existing: NpcRecord[], updates: NpcRecord[] = []): NpcRecord[] {
  const byName = new Map(existing.map((npc) => [npc.name, npc]));

  for (const update of updates) {
    const current = byName.get(update.name);
    byName.set(update.name, {
      name: update.name,
      attitude: update.attitude || current?.attitude || '未知',
      knownFacts: unique([...(current?.knownFacts ?? []), ...update.knownFacts])
    });
  }

  return Array.from(byName.values());
}

function clampEndingProgress(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export function createInitialGameState(story: StoryConfig, maxTurns = 15): GameState {
  return {
    storyId: story.id,
    turn: 0,
    maxTurns,
    currentLocation: '故事开端',
    dangerLevel: 'low',
    endingProgress: 0,
    playerStatus: [],
    npcRegistry: [],
    clues: [],
    worldMemory: [],
    isEnded: false
  };
}

export function applyStatePatch(state: GameState, patch: AiStatePatch): GameState {
  const playerStatus = unique([
    ...state.playerStatus.filter((status) => !(patch.playerStatusRemoved ?? []).includes(status)),
    ...(patch.playerStatusAdded ?? [])
  ]);

  const endingProgress = clampEndingProgress(
    state.endingProgress + (patch.endingProgressDelta ?? 0)
  );

  return {
    ...state,
    currentLocation: patch.currentLocation ?? state.currentLocation,
    dangerLevel: patch.dangerLevel ?? state.dangerLevel,
    endingProgress,
    playerStatus,
    clues: unique([...state.clues, ...(patch.cluesAdded ?? [])]),
    worldMemory: unique([...state.worldMemory, ...(patch.worldMemoryAdded ?? [])]),
    npcRegistry: mergeNpcRecords(state.npcRegistry, patch.npcUpdates),
    isEnded: state.isEnded || endingProgress >= 1 || state.turn >= state.maxTurns
  };
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test -- src/game/stateReducer.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit domain model**

```bash
git add src/game
git commit -m "feat: add story game domain model"
```

---

### Task 3: Prompt Builder and AI Client

**Files:**
- Create: `src/game/promptBuilder.ts`
- Create: `src/game/promptBuilder.test.ts`
- Create: `src/game/aiClient.ts`
- Create: `src/game/aiClient.test.ts`

- [ ] **Step 1: Write failing prompt builder tests**

Create `src/game/promptBuilder.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildOpeningPrompt, buildTurnPrompt } from './promptBuilder';
import type { GameState, StoryConfig, TurnLog } from './types';

const story: StoryConfig = {
  id: 'story-1',
  title: '雨夜钟楼',
  genre: '悬疑',
  style: '严肃短篇',
  worldSetting: '旧城午夜会响起第十三声钟。',
  rules: ['普通人不能施法'],
  playerCharacter: {
    name: '林舟',
    identity: '档案修复师',
    goal: '查清父亲失踪真相',
    abilities: ['观察'],
    weaknesses: ['体力较弱']
  },
  modelConfig: { baseUrl: 'https://api.example.com/v1', apiKey: 'sk-test', model: 'test' },
  createdAt: '2026-05-12T00:00:00.000Z'
};

const state: GameState = {
  storyId: 'story-1',
  turn: 2,
  maxTurns: 15,
  currentLocation: '钟楼',
  dangerLevel: 'medium',
  endingProgress: 0.2,
  playerStatus: ['紧张'],
  npcRegistry: [],
  clues: ['银色徽章'],
  worldMemory: ['守夜人知道旧案'],
  isEnded: false
};

describe('promptBuilder', () => {
  it('builds opening prompts requiring strict JSON', () => {
    const messages = buildOpeningPrompt(story);

    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('只输出 JSON');
    expect(messages[1].content).toContain('雨夜钟楼');
    expect(messages[1].content).toContain('普通人不能施法');
  });

  it('builds turn prompts with recent history and player action', () => {
    const turns: TurnLog[] = [
      {
        storyId: 'story-1',
        turn: 1,
        playerAction: '我观察徽章。',
        verdict: 'allowed',
        verdictReason: '符合能力。',
        storyText: '你看见徽章编号。',
        choicePoint: '你要怎么做？',
        statePatch: {},
        createdAt: '2026-05-12T00:00:00.000Z'
      }
    ];

    const messages = buildTurnPrompt(story, state, turns, '我询问守夜人。');

    expect(messages[1].content).toContain('我询问守夜人。');
    expect(messages[1].content).toContain('银色徽章');
    expect(messages[1].content).toContain('你看见徽章编号。');
  });
});
```

- [ ] **Step 2: Run prompt tests to verify failure**

Run: `npm test -- src/game/promptBuilder.test.ts`

Expected: FAIL because `promptBuilder.ts` does not exist.

- [ ] **Step 3: Implement prompt builder**

Create `src/game/promptBuilder.ts`:

```ts
import type { GameState, StoryConfig, TurnLog } from './types';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

const jsonContract = `只输出 JSON，不要输出 Markdown。JSON 字段必须包含 verdict, verdict_reason, story_text, choice_point, state_patch。verdict 只能是 allowed, allowed_with_cost, failed_forward, rejected。`;

function storyBrief(story: StoryConfig): string {
  return [
    `标题：${story.title}`,
    `题材：${story.genre}`,
    `风格：${story.style}`,
    `世界观：${story.worldSetting}`,
    `规则：${story.rules.join('；')}`,
    `玩家角色：${story.playerCharacter.name}，${story.playerCharacter.identity}`,
    `角色目标：${story.playerCharacter.goal}`,
    `能力：${story.playerCharacter.abilities.join('、')}`,
    `弱点：${story.playerCharacter.weaknesses.join('、')}`
  ].join('\n');
}

function stateBrief(state: GameState): string {
  return [
    `回合：${state.turn}/${state.maxTurns}`,
    `地点：${state.currentLocation}`,
    `危险度：${state.dangerLevel}`,
    `结局进度：${state.endingProgress}`,
    `玩家状态：${state.playerStatus.join('、') || '无'}`,
    `线索：${state.clues.join('、') || '无'}`,
    `世界记忆：${state.worldMemory.join('、') || '无'}`,
    `NPC：${state.npcRegistry.map((npc) => `${npc.name}(${npc.attitude})`).join('、') || '无'}`
  ].join('\n');
}

function recentHistory(turns: TurnLog[]): string {
  return turns
    .slice(-5)
    .map((turn) => `第${turn.turn}回合\n玩家：${turn.playerAction}\n正文：${turn.storyText}\n抉择点：${turn.choicePoint}`)
    .join('\n\n');
}

export function buildOpeningPrompt(story: StoryConfig): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `你是互动小说游戏的故事导演、行动裁判和状态记录器。${jsonContract}`
    },
    {
      role: 'user',
      content: `${storyBrief(story)}\n\n请生成开篇。verdict 使用 allowed，player_action 视为“故事开始”。正文应是小说段落，末尾必须有抉择点。`
    }
  ];
}

export function buildTurnPrompt(
  story: StoryConfig,
  state: GameState,
  turns: TurnLog[],
  playerAction: string
): ChatMessage[] {
  return [
    {
      role: 'system',
      content: `你是互动小说游戏的故事导演、行动裁判和状态记录器。${jsonContract}`
    },
    {
      role: 'user',
      content: [
        storyBrief(story),
        '',
        '当前状态：',
        stateBrief(state),
        '',
        '最近历史：',
        recentHistory(turns) || '无',
        '',
        `玩家行动：${playerAction}`,
        '',
        '请先裁判行动是否合理，再续写剧情。若 verdict 是 rejected，story_text 应简短说明为什么需要重写，不推进剧情。'
      ].join('\n')
    }
  ];
}
```

- [ ] **Step 4: Write failing AI client tests**

Create `src/game/aiClient.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { callAiModel, parseAiTurnResponse } from './aiClient';
import type { ModelConfig } from './types';

describe('aiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses clean JSON AI responses', () => {
    const parsed = parseAiTurnResponse(JSON.stringify({
      verdict: 'allowed',
      verdict_reason: '符合设定',
      story_text: '雨继续下。',
      choice_point: '你要怎么做？',
      state_patch: { cluesAdded: ['银色徽章'] }
    }));

    expect(parsed.verdict).toBe('allowed');
    expect(parsed.state_patch.cluesAdded).toEqual(['银色徽章']);
  });

  it('rejects invalid verdict values', () => {
    expect(() => parseAiTurnResponse(JSON.stringify({
      verdict: 'maybe',
      verdict_reason: 'x',
      story_text: 'x',
      choice_point: 'x',
      state_patch: {}
    }))).toThrow('Invalid AI verdict');
  });

  it('calls OpenAI-compatible chat completions endpoint', async () => {
    const config: ModelConfig = {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test',
      model: 'test-model'
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                verdict: 'allowed',
                verdict_reason: '符合设定',
                story_text: '正文',
                choice_point: '抉择',
                state_patch: {}
              })
            }
          }
        ]
      })
    });

    const result = await callAiModel(config, [{ role: 'user', content: 'hello' }], fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer sk-test' })
    }));
    expect(result.story_text).toBe('正文');
  });
});
```

- [ ] **Step 5: Implement AI client**

Create `src/game/aiClient.ts`:

```ts
import type { ChatMessage } from './promptBuilder';
import type { AiTurnResponse, ModelConfig, Verdict } from './types';

const verdicts: Verdict[] = ['allowed', 'allowed_with_cost', 'failed_forward', 'rejected'];

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export function parseAiTurnResponse(content: string): AiTurnResponse {
  const parsed = JSON.parse(content) as Partial<AiTurnResponse>;

  if (!parsed.verdict || !verdicts.includes(parsed.verdict)) {
    throw new Error('Invalid AI verdict');
  }
  if (typeof parsed.verdict_reason !== 'string') throw new Error('Invalid AI verdict_reason');
  if (typeof parsed.story_text !== 'string') throw new Error('Invalid AI story_text');
  if (typeof parsed.choice_point !== 'string') throw new Error('Invalid AI choice_point');

  return {
    verdict: parsed.verdict,
    verdict_reason: parsed.verdict_reason,
    story_text: parsed.story_text,
    choice_point: parsed.choice_point,
    state_patch: parsed.state_patch ?? {}
  };
}

export async function callAiModel(
  config: ModelConfig,
  messages: ChatMessage[],
  fetcher: typeof fetch = fetch
): Promise<AiTurnResponse> {
  const response = await fetcher(`${normalizeBaseUrl(config.baseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.8,
      messages
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('AI response did not include message content');
  }

  return parseAiTurnResponse(content);
}
```

- [ ] **Step 6: Run tests**

Run: `npm test -- src/game/promptBuilder.test.ts src/game/aiClient.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit AI foundations**

```bash
git add src/game/promptBuilder.ts src/game/promptBuilder.test.ts src/game/aiClient.ts src/game/aiClient.test.ts
git commit -m "feat: add AI prompt and client foundations"
```

---

### Task 4: Local Persistence

**Files:**
- Create: `src/storage/indexedDb.ts`
- Create: `src/storage/saveStore.ts`
- Create: `src/storage/saveStore.test.ts`

- [ ] **Step 1: Write failing persistence tests**

Create `src/storage/saveStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { clearAllStories, getStory, listStories, saveStory } from './saveStore';
import type { SavedStory } from '../game/types';

const savedStory: SavedStory = {
  config: {
    id: 'story-1',
    title: '雨夜钟楼',
    genre: '悬疑',
    style: '严肃短篇',
    worldSetting: '旧城',
    rules: ['普通人不能施法'],
    playerCharacter: {
      name: '林舟',
      identity: '档案修复师',
      goal: '查清真相',
      abilities: ['观察'],
      weaknesses: ['体力较弱']
    },
    modelConfig: {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test',
      model: 'test-model'
    },
    createdAt: '2026-05-12T00:00:00.000Z'
  },
  state: {
    storyId: 'story-1',
    turn: 0,
    maxTurns: 15,
    currentLocation: '故事开端',
    dangerLevel: 'low',
    endingProgress: 0,
    playerStatus: [],
    npcRegistry: [],
    clues: [],
    worldMemory: [],
    isEnded: false
  },
  turns: []
};

describe('saveStore', () => {
  beforeEach(async () => {
    await clearAllStories();
  });

  it('saves and loads a story', async () => {
    await saveStory(savedStory);

    await expect(getStory('story-1')).resolves.toEqual(savedStory);
  });

  it('lists stories without exposing API keys', async () => {
    await saveStory(savedStory);

    const stories = await listStories();

    expect(stories).toEqual([
      {
        id: 'story-1',
        title: '雨夜钟楼',
        turn: 0,
        maxTurns: 15,
        isEnded: false,
        updatedAt: expect.any(String)
      }
    ]);
  });
});
```

- [ ] **Step 2: Run persistence tests to verify failure**

Run: `npm test -- src/storage/saveStore.test.ts`

Expected: FAIL because storage modules do not exist.

- [ ] **Step 3: Implement IndexedDB wrapper**

Create `src/storage/indexedDb.ts`:

```ts
const DB_NAME = 'story-generator';
const DB_VERSION = 1;
const STORY_STORE = 'stories';

export interface StoryRecord<T> {
  id: string;
  value: T;
  updatedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORY_STORE)) {
        db.createObjectStore(STORY_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORY_STORE, mode);
        const store = tx.objectStore(STORY_STORE);
        const request = run(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => reject(tx.error);
      })
  );
}

export async function putRecord<T>(record: StoryRecord<T>): Promise<void> {
  await transaction('readwrite', (store) => store.put(record));
}

export function getRecord<T>(id: string): Promise<StoryRecord<T> | undefined> {
  return transaction('readonly', (store) => store.get(id));
}

export function getAllRecords<T>(): Promise<StoryRecord<T>[]> {
  return transaction('readonly', (store) => store.getAll());
}

export async function clearRecords(): Promise<void> {
  await transaction('readwrite', (store) => store.clear());
}
```

- [ ] **Step 4: Implement save store facade**

Create `src/storage/saveStore.ts`:

```ts
import type { SavedStory } from '../game/types';
import { clearRecords, getAllRecords, getRecord, putRecord } from './indexedDb';

export interface StoryListItem {
  id: string;
  title: string;
  turn: number;
  maxTurns: number;
  isEnded: boolean;
  updatedAt: string;
}

export async function saveStory(story: SavedStory): Promise<void> {
  await putRecord<SavedStory>({
    id: story.config.id,
    value: story,
    updatedAt: new Date().toISOString()
  });
  localStorage.setItem('story-generator:lastStoryId', story.config.id);
}

export async function getStory(id: string): Promise<SavedStory | undefined> {
  return (await getRecord<SavedStory>(id))?.value;
}

export async function listStories(): Promise<StoryListItem[]> {
  const records = await getAllRecords<SavedStory>();

  return records
    .map((record) => ({
      id: record.value.config.id,
      title: record.value.config.title,
      turn: record.value.state.turn,
      maxTurns: record.value.state.maxTurns,
      isEnded: record.value.state.isEnded,
      updatedAt: record.updatedAt
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLastStoryId(): string | null {
  return localStorage.getItem('story-generator:lastStoryId');
}

export async function clearAllStories(): Promise<void> {
  localStorage.removeItem('story-generator:lastStoryId');
  await clearRecords();
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/storage/saveStore.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit persistence**

```bash
git add src/storage
git commit -m "feat: add local story persistence"
```

---

### Task 5: Story Engine Orchestration

**Files:**
- Create: `src/game/storyEngine.ts`
- Create: `src/game/storyEngine.test.ts`

- [ ] **Step 1: Write failing story engine tests**

Create `src/game/storyEngine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createStoryFromInput, playActionTurn } from './storyEngine';

describe('storyEngine', () => {
  it('creates a saved story from creation input and opening AI result', async () => {
    const story = await createStoryFromInput(
      {
        title: '雨夜钟楼',
        genre: '悬疑',
        style: '严肃短篇',
        worldSetting: '旧城',
        rulesText: '普通人不能施法\n午夜钟声会改变记忆',
        characterName: '林舟',
        characterIdentity: '档案修复师',
        characterGoal: '查清真相',
        abilitiesText: '观察\n推理',
        weaknessesText: '体力较弱',
        baseUrl: 'https://api.example.com/v1',
        apiKey: 'sk-test',
        model: 'test-model'
      },
      async () => ({
        verdict: 'allowed',
        verdict_reason: '开篇',
        story_text: '雨落在钟楼上。',
        choice_point: '你要进入钟楼吗？',
        state_patch: {
          currentLocation: '钟楼外',
          cluesAdded: ['钟楼']
        }
      })
    );

    expect(story.config.title).toBe('雨夜钟楼');
    expect(story.state.turn).toBe(1);
    expect(story.turns[0].storyText).toBe('雨落在钟楼上。');
    expect(story.state.clues).toEqual(['钟楼']);
  });

  it('does not advance state when AI rejects an action', async () => {
    const story = await createStoryFromInput(
      {
        title: '雨夜钟楼',
        genre: '悬疑',
        style: '严肃短篇',
        worldSetting: '旧城',
        rulesText: '普通人不能施法',
        characterName: '林舟',
        characterIdentity: '档案修复师',
        characterGoal: '查清真相',
        abilitiesText: '观察',
        weaknessesText: '体力较弱',
        baseUrl: 'https://api.example.com/v1',
        apiKey: 'sk-test',
        model: 'test-model'
      },
      async () => ({
        verdict: 'allowed',
        verdict_reason: '开篇',
        story_text: '开篇正文',
        choice_point: '抉择点',
        state_patch: {}
      })
    );

    const next = await playActionTurn(story, '我召唤雷电毁掉城市。', async () => ({
      verdict: 'rejected',
      verdict_reason: '角色没有魔法能力。',
      story_text: '这个行动不符合当前角色能力，请换一种行动。',
      choice_point: '请重新输入合理行动。',
      state_patch: {}
    }));

    expect(next.state.turn).toBe(1);
    expect(next.turns).toHaveLength(2);
    expect(next.turns[1].verdict).toBe('rejected');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- src/game/storyEngine.test.ts`

Expected: FAIL because `storyEngine.ts` does not exist.

- [ ] **Step 3: Implement story engine**

Create `src/game/storyEngine.ts`:

```ts
import { createId } from './id';
import { buildOpeningPrompt, buildTurnPrompt } from './promptBuilder';
import { applyStatePatch, createInitialGameState } from './stateReducer';
import type { AiTurnResponse, SavedStory, StoryConfig, TurnLog } from './types';

export interface CreateStoryInput {
  title: string;
  genre: string;
  style: string;
  worldSetting: string;
  rulesText: string;
  characterName: string;
  characterIdentity: string;
  characterGoal: string;
  abilitiesText: string;
  weaknessesText: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export type AiRunner = (messages: ReturnType<typeof buildOpeningPrompt>) => Promise<AiTurnResponse>;

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function createTurnLog(
  storyId: string,
  turn: number,
  playerAction: string,
  response: AiTurnResponse
): TurnLog {
  return {
    storyId,
    turn,
    playerAction,
    verdict: response.verdict,
    verdictReason: response.verdict_reason,
    storyText: response.story_text,
    choicePoint: response.choice_point,
    statePatch: response.state_patch,
    createdAt: new Date().toISOString()
  };
}

export async function createStoryFromInput(
  input: CreateStoryInput,
  runAi: AiRunner
): Promise<SavedStory> {
  const config: StoryConfig = {
    id: createId('story'),
    title: input.title.trim(),
    genre: input.genre.trim(),
    style: input.style.trim(),
    worldSetting: input.worldSetting.trim(),
    rules: splitLines(input.rulesText),
    playerCharacter: {
      name: input.characterName.trim(),
      identity: input.characterIdentity.trim(),
      goal: input.characterGoal.trim(),
      abilities: splitLines(input.abilitiesText),
      weaknesses: splitLines(input.weaknessesText)
    },
    modelConfig: {
      baseUrl: input.baseUrl.trim(),
      apiKey: input.apiKey.trim(),
      model: input.model.trim()
    },
    createdAt: new Date().toISOString()
  };

  const initialState = createInitialGameState(config, 15);
  const response = await runAi(buildOpeningPrompt(config));
  const openingTurn = createTurnLog(config.id, 1, '故事开始', response);
  const patchedState = applyStatePatch(initialState, response.state_patch);

  return {
    config,
    state: {
      ...patchedState,
      turn: 1,
      isEnded: patchedState.endingProgress >= 1
    },
    turns: [openingTurn]
  };
}

export async function playActionTurn(
  savedStory: SavedStory,
  playerAction: string,
  runAi: AiRunner
): Promise<SavedStory> {
  const response = await runAi(
    buildTurnPrompt(savedStory.config, savedStory.state, savedStory.turns, playerAction)
  );
  const advancesTurn = response.verdict !== 'rejected';
  const turnNumber = advancesTurn ? savedStory.state.turn + 1 : savedStory.state.turn;
  const log = createTurnLog(savedStory.config.id, turnNumber, playerAction, response);
  const patchedState = advancesTurn
    ? applyStatePatch(savedStory.state, response.state_patch)
    : savedStory.state;
  const nextTurn = advancesTurn ? turnNumber : savedStory.state.turn;

  return {
    ...savedStory,
    state: {
      ...patchedState,
      turn: nextTurn,
      isEnded: patchedState.isEnded || nextTurn >= patchedState.maxTurns
    },
    turns: [...savedStory.turns, log]
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- src/game/storyEngine.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit story engine**

```bash
git add src/game/storyEngine.ts src/game/storyEngine.test.ts
git commit -m "feat: add story engine orchestration"
```

---

### Task 6: Zustand Store and Routing

**Files:**
- Create: `src/store/useGameStore.ts`
- Create: `src/store/useGameStore.test.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing store tests**

Create `src/store/useGameStore.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './useGameStore';
import { clearAllStories } from '../storage/saveStore';

describe('useGameStore', () => {
  beforeEach(async () => {
    await clearAllStories();
    useGameStore.setState({
      currentStory: undefined,
      isLoading: false,
      error: undefined
    });
  });

  it('stores errors from failed story creation', async () => {
    await useGameStore.getState().createStory({
      title: '雨夜钟楼',
      genre: '悬疑',
      style: '严肃短篇',
      worldSetting: '旧城',
      rulesText: '普通人不能施法',
      characterName: '林舟',
      characterIdentity: '档案修复师',
      characterGoal: '查清真相',
      abilitiesText: '观察',
      weaknessesText: '体力较弱',
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'sk-test',
      model: 'test-model'
    }, async () => {
      throw new Error('AI unavailable');
    });

    expect(useGameStore.getState().error).toBe('AI unavailable');
    expect(useGameStore.getState().isLoading).toBe(false);
  });
});
```

- [ ] **Step 2: Run store test to verify failure**

Run: `npm test -- src/store/useGameStore.test.ts`

Expected: FAIL because `useGameStore.ts` does not exist.

- [ ] **Step 3: Implement Zustand store**

Create `src/store/useGameStore.ts`:

```ts
import { create } from 'zustand';
import { callAiModel } from '../game/aiClient';
import { createStoryFromInput, playActionTurn, type AiRunner, type CreateStoryInput } from '../game/storyEngine';
import type { SavedStory } from '../game/types';
import { getStory, saveStory } from '../storage/saveStore';

interface GameStore {
  currentStory?: SavedStory;
  isLoading: boolean;
  error?: string;
  createStory: (input: CreateStoryInput, runner?: AiRunner) => Promise<void>;
  loadStory: (storyId: string) => Promise<void>;
  playAction: (action: string, runner?: AiRunner) => Promise<void>;
  clearError: () => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentStory: undefined,
  isLoading: false,
  error: undefined,
  async createStory(input, runner) {
    set({ isLoading: true, error: undefined });
    try {
      const aiRunner: AiRunner =
        runner ?? ((messages) => callAiModel({ baseUrl: input.baseUrl, apiKey: input.apiKey, model: input.model }, messages));
      const story = await createStoryFromInput(input, aiRunner);
      await saveStory(story);
      set({ currentStory: story, isLoading: false });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
    }
  },
  async loadStory(storyId) {
    set({ isLoading: true, error: undefined });
    try {
      const story = await getStory(storyId);
      if (!story) throw new Error('未找到故事存档');
      set({ currentStory: story, isLoading: false });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
    }
  },
  async playAction(action, runner) {
    const story = get().currentStory;
    if (!story) {
      set({ error: '没有正在进行的故事' });
      return;
    }
    set({ isLoading: true, error: undefined });
    try {
      const aiRunner: AiRunner = runner ?? ((messages) => callAiModel(story.config.modelConfig, messages));
      const next = await playActionTurn(story, action, aiRunner);
      await saveStory(next);
      set({ currentStory: next, isLoading: false });
    } catch (error) {
      set({ error: errorMessage(error), isLoading: false });
    }
  },
  clearError() {
    set({ error: undefined });
  }
}));
```

- [ ] **Step 4: Replace app shell with simple route switch**

Modify `src/App.tsx`:

```tsx
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
```

Create temporary page placeholders so the app compiles; full UI is implemented in the next task.

Create `src/pages/CreateStoryPage.tsx`:

```tsx
export default function CreateStoryPage() {
  return (
    <main className="page page-narrow">
      <h1>创建一本新的小说</h1>
      <label htmlFor="title">故事标题</label>
      <input id="title" name="title" />
    </main>
  );
}
```

Create `src/pages/GameReaderPage.tsx`:

```tsx
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
```

- [ ] **Step 5: Run tests**

Run: `npm test -- src/store/useGameStore.test.ts src/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit store and routing**

```bash
git add src/store src/pages src/App.tsx
git commit -m "feat: add game store and page routing"
```

---

### Task 7: Create Story Page UI

**Files:**
- Create: `src/components/ModelConfigForm.tsx`
- Modify: `src/pages/CreateStoryPage.tsx`
- Create: `src/pages/CreateStoryPage.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing create page tests**

Create `src/pages/CreateStoryPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateStoryPage from './CreateStoryPage';
import { useGameStore } from '../store/useGameStore';

describe('CreateStoryPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentStory: undefined,
      isLoading: false,
      error: undefined
    });
  });

  it('submits story creation input to the store', async () => {
    const createStory = vi.fn().mockResolvedValue(undefined);
    useGameStore.setState({ createStory });
    const user = userEvent.setup();

    render(<CreateStoryPage />);

    await user.clear(screen.getByLabelText('故事标题'));
    await user.type(screen.getByLabelText('故事标题'), '雨夜钟楼');
    await user.click(screen.getByRole('button', { name: '进入故事' }));

    expect(createStory).toHaveBeenCalledWith(expect.objectContaining({
      title: '雨夜钟楼',
      genre: expect.any(String),
      baseUrl: expect.any(String),
      model: expect.any(String)
    }));
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test -- src/pages/CreateStoryPage.test.tsx`

Expected: FAIL because the page does not submit a full form.

- [ ] **Step 3: Implement model config component**

Create `src/components/ModelConfigForm.tsx`:

```tsx
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
```

- [ ] **Step 4: Implement create story page**

Modify `src/pages/CreateStoryPage.tsx`:

```tsx
import { FormEvent, useState } from 'react';
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

  function update(field: keyof typeof defaults, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await createStory(form);
  }

  if (currentStory) {
    window.history.pushState(null, '', `/play/${currentStory.config.id}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
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
```

- [ ] **Step 5: Add form styling**

Append to `src/styles.css`:

```css
.lede {
  color: #73736d;
  line-height: 1.7;
}

.panel {
  background: #ffffff;
  border: 1px solid #deded8;
  border-radius: 8px;
}

.form-grid {
  display: grid;
  gap: 18px;
  padding: 28px;
}

.form-section {
  display: grid;
  gap: 14px;
  border-top: 1px solid #deded8;
  padding-top: 18px;
}

.form-section h2 {
  margin: 0;
  font-size: 18px;
}

label {
  display: grid;
  gap: 8px;
  color: #73736d;
  font-size: 14px;
}

input,
textarea {
  width: 100%;
  border: 1px solid #deded8;
  border-radius: 6px;
  background: #ffffff;
  color: #20201d;
  padding: 12px 13px;
}

textarea {
  min-height: 96px;
  resize: vertical;
  line-height: 1.65;
}

button {
  border: 0;
  border-radius: 6px;
  background: #1d1d1b;
  color: #ffffff;
  min-height: 42px;
  padding: 0 18px;
  justify-self: start;
}

button:disabled {
  opacity: 0.6;
}

.error {
  color: #b42318;
  margin: 0;
}
```

- [ ] **Step 6: Run create page tests**

Run: `npm test -- src/pages/CreateStoryPage.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit create page**

```bash
git add src/components/ModelConfigForm.tsx src/pages/CreateStoryPage.tsx src/pages/CreateStoryPage.test.tsx src/styles.css
git commit -m "feat: add create story page"
```

---

### Task 8: Game Reader UI

**Files:**
- Create: `src/components/NovelView.tsx`
- Create: `src/components/ActionInput.tsx`
- Create: `src/components/SidebarStatePanel.tsx`
- Create: `src/components/ErrorNotice.tsx`
- Modify: `src/pages/GameReaderPage.tsx`
- Create: `src/pages/GameReaderPage.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing reader page tests**

Create `src/pages/GameReaderPage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameReaderPage from './GameReaderPage';
import { useGameStore } from '../store/useGameStore';

describe('GameReaderPage', () => {
  beforeEach(() => {
    useGameStore.setState({
      isLoading: false,
      error: undefined,
      loadStory: vi.fn().mockResolvedValue(undefined),
      playAction: vi.fn().mockResolvedValue(undefined),
      currentStory: {
        config: {
          id: 'story-1',
          title: '雨夜钟楼',
          genre: '悬疑',
          style: '严肃短篇',
          worldSetting: '旧城',
          rules: ['普通人不能施法'],
          playerCharacter: {
            name: '林舟',
            identity: '档案修复师',
            goal: '查清真相',
            abilities: ['观察'],
            weaknesses: ['体力较弱']
          },
          modelConfig: { baseUrl: 'x', apiKey: 'x', model: 'x' },
          createdAt: '2026-05-12T00:00:00.000Z'
        },
        state: {
          storyId: 'story-1',
          turn: 3,
          maxTurns: 15,
          currentLocation: '钟楼',
          dangerLevel: 'medium',
          endingProgress: 0.2,
          playerStatus: ['紧张'],
          npcRegistry: [{ name: '守夜人', attitude: '戒备', knownFacts: ['知道旧案'] }],
          clues: ['银色徽章'],
          worldMemory: ['午夜钟声会改变记忆'],
          isEnded: false
        },
        turns: [
          {
            storyId: 'story-1',
            turn: 3,
            playerAction: '询问守夜人',
            verdict: 'allowed',
            verdictReason: '合理',
            storyText: '雨水敲在钟楼的铜檐上。',
            choicePoint: '你要怎么做？',
            statePatch: {},
            createdAt: '2026-05-12T00:00:00.000Z'
          }
        ]
      }
    });
  });

  it('renders novel prose, sidebar state, and action input', async () => {
    render(<GameReaderPage storyId="story-1" />);

    expect(screen.getByRole('heading', { name: '雨夜钟楼' })).toBeInTheDocument();
    expect(screen.getByText('雨水敲在钟楼的铜檐上。')).toBeInTheDocument();
    expect(screen.getByText('守夜人')).toBeInTheDocument();
    expect(screen.getByLabelText('输入你的行动')).toBeInTheDocument();
  });

  it('submits player actions', async () => {
    const playAction = vi.fn().mockResolvedValue(undefined);
    useGameStore.setState({ playAction });
    const user = userEvent.setup();

    render(<GameReaderPage storyId="story-1" />);

    await user.type(screen.getByLabelText('输入你的行动'), '我继续追问。');
    await user.click(screen.getByRole('button', { name: '发送' }));

    expect(playAction).toHaveBeenCalledWith('我继续追问。');
  });
});
```

- [ ] **Step 2: Run reader tests to verify failure**

Run: `npm test -- src/pages/GameReaderPage.test.tsx`

Expected: FAIL because reader components are not implemented.

- [ ] **Step 3: Implement reader components**

Create `src/components/NovelView.tsx`:

```tsx
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
```

Create `src/components/ActionInput.tsx`:

```tsx
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
```

Create `src/components/SidebarStatePanel.tsx`:

```tsx
import type { GameState, PlayerCharacter } from '../game/types';

interface SidebarStatePanelProps {
  character: PlayerCharacter;
  rules: string[];
  state: GameState;
}

export default function SidebarStatePanel({ character, rules, state }: SidebarStatePanelProps) {
  return (
    <aside className="sidebar">
      <section>
        <h2>角色卡</h2>
        <p>{character.name}，{character.identity}</p>
        <p>目标：{character.goal}</p>
      </section>
      <section>
        <h2>NPC</h2>
        {state.npcRegistry.length ? state.npcRegistry.map((npc) => (
          <p key={npc.name}>{npc.name}：{npc.attitude}</p>
        )) : <p>暂无</p>}
      </section>
      <section>
        <h2>线索</h2>
        <p>{state.clues.join('、') || '暂无'}</p>
      </section>
      <section>
        <h2>世界规则</h2>
        <p>{rules.join('、') || '暂无'}</p>
      </section>
      <section>
        <h2>状态</h2>
        <p>地点：{state.currentLocation}</p>
        <p>危险度：{state.dangerLevel}</p>
        <p>回合：{state.turn} / {state.maxTurns}</p>
      </section>
    </aside>
  );
}
```

Create `src/components/ErrorNotice.tsx`:

```tsx
interface ErrorNoticeProps {
  message?: string;
}

export default function ErrorNotice({ message }: ErrorNoticeProps) {
  if (!message) return null;

  return <p className="error" role="alert">{message}</p>;
}
```

- [ ] **Step 4: Implement game reader page**

Modify `src/pages/GameReaderPage.tsx`:

```tsx
import { useEffect } from 'react';
import ActionInput from '../components/ActionInput';
import ErrorNotice from '../components/ErrorNotice';
import NovelView from '../components/NovelView';
import SidebarStatePanel from '../components/SidebarStatePanel';
import { useGameStore } from '../store/useGameStore';

interface GameReaderPageProps {
  storyId: string;
}

export default function GameReaderPage({ storyId }: GameReaderPageProps) {
  const { currentStory, isLoading, error, loadStory, playAction } = useGameStore();

  useEffect(() => {
    if (!currentStory || currentStory.config.id !== storyId) {
      void loadStory(storyId);
    }
  }, [currentStory, loadStory, storyId]);

  if (!currentStory) {
    return <main className="page">正在读取故事...</main>;
  }

  return (
    <div className="reader-page">
      <header className="topbar">
        <h1>{currentStory.config.title}</h1>
        <span>第 {currentStory.state.turn} / {currentStory.state.maxTurns} 回合</span>
      </header>
      <div className="reader-layout">
        <main className="reader-main">
          <NovelView title={currentStory.config.title} turns={currentStory.turns} />
          <ErrorNotice message={error} />
          <ActionInput disabled={isLoading || currentStory.state.isEnded} onSubmit={playAction} />
        </main>
        <SidebarStatePanel
          character={currentStory.config.playerCharacter}
          rules={currentStory.config.rules}
          state={currentStory.state}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add reader styling**

Append to `src/styles.css`:

```css
.reader-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #deded8;
  background: rgba(247, 247, 245, 0.94);
}

.topbar h1 {
  margin: 0;
  font-size: 18px;
}

.topbar span {
  color: #73736d;
  font-size: 14px;
}

.reader-layout {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  min-height: calc(100vh - 56px);
}

.reader-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.novel {
  flex: 1;
  overflow: auto;
  padding: 46px min(9vw, 120px) 36px;
}

.novel h1 {
  margin: 0 0 28px;
  text-align: center;
  font: 600 26px Georgia, "Times New Roman", "SimSun", serif;
}

.turn-section p {
  max-width: 760px;
  margin: 0 auto 17px;
  text-indent: 2em;
  font: 18px/2 Georgia, "Times New Roman", "SimSun", serif;
}

.choice-point {
  max-width: 760px;
  margin: 30px auto;
  padding: 15px 17px;
  border: 1px solid #deded8;
  border-radius: 6px;
  background: #efefeb;
  color: #73736d;
  line-height: 1.75;
}

.action-input {
  border-top: 1px solid #deded8;
  padding: 14px 18px;
  display: flex;
  gap: 10px;
  background: #fbfbfa;
}

.action-input input {
  height: 44px;
}

.sidebar {
  border-left: 1px solid #deded8;
  background: #fbfbfa;
  padding: 20px 18px;
  overflow: auto;
}

.sidebar section {
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #deded8;
}

.sidebar section:last-child {
  border-bottom: 0;
}

.sidebar h2 {
  margin: 0 0 9px;
  font-size: 14px;
  color: #73736d;
}

.sidebar p {
  margin: 0 0 6px;
  line-height: 1.65;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

@media (max-width: 860px) {
  .reader-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-left: 0;
    border-top: 1px solid #deded8;
  }

  .novel {
    padding: 32px 22px;
  }
}
```

- [ ] **Step 6: Run reader tests**

Run: `npm test -- src/pages/GameReaderPage.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit reader page**

```bash
git add src/components/NovelView.tsx src/components/ActionInput.tsx src/components/SidebarStatePanel.tsx src/components/ErrorNotice.tsx src/pages/GameReaderPage.tsx src/pages/GameReaderPage.test.tsx src/styles.css
git commit -m "feat: add game reader page"
```

---

### Task 9: Export Story Text and Ending State

**Files:**
- Create: `src/game/exportStory.ts`
- Create: `src/game/exportStory.test.ts`
- Create: `src/components/ExportStoryButton.tsx`
- Modify: `src/pages/GameReaderPage.tsx`

- [ ] **Step 1: Write failing export tests**

Create `src/game/exportStory.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildStoryExportText } from './exportStory';
import type { SavedStory } from './types';

describe('exportStory', () => {
  it('builds readable novel text from saved story turns', () => {
    const story: SavedStory = {
      config: {
        id: 'story-1',
        title: '雨夜钟楼',
        genre: '悬疑',
        style: '严肃短篇',
        worldSetting: '旧城',
        rules: [],
        playerCharacter: {
          name: '林舟',
          identity: '档案修复师',
          goal: '查清真相',
          abilities: [],
          weaknesses: []
        },
        modelConfig: { baseUrl: 'x', apiKey: 'secret', model: 'x' },
        createdAt: '2026-05-12T00:00:00.000Z'
      },
      state: {
        storyId: 'story-1',
        turn: 1,
        maxTurns: 15,
        currentLocation: '钟楼',
        dangerLevel: 'low',
        endingProgress: 0,
        playerStatus: [],
        npcRegistry: [],
        clues: [],
        worldMemory: [],
        isEnded: false
      },
      turns: [
        {
          storyId: 'story-1',
          turn: 1,
          playerAction: '故事开始',
          verdict: 'allowed',
          verdictReason: '开篇',
          storyText: '雨落下。',
          choicePoint: '你要怎么做？',
          statePatch: {},
          createdAt: '2026-05-12T00:00:00.000Z'
        }
      ]
    };

    const text = buildStoryExportText(story);

    expect(text).toContain('雨夜钟楼');
    expect(text).toContain('雨落下。');
    expect(text).not.toContain('secret');
  });
});
```

- [ ] **Step 2: Run export tests to verify failure**

Run: `npm test -- src/game/exportStory.test.ts`

Expected: FAIL because `exportStory.ts` does not exist.

- [ ] **Step 3: Implement export builder**

Create `src/game/exportStory.ts`:

```ts
import type { SavedStory } from './types';

export function buildStoryExportText(story: SavedStory): string {
  const header = [
    story.config.title,
    '',
    `题材：${story.config.genre}`,
    `风格：${story.config.style}`,
    `主角：${story.config.playerCharacter.name}，${story.config.playerCharacter.identity}`,
    ''
  ].join('\n');

  const body = story.turns
    .map((turn) => [turn.storyText, '', `抉择点：${turn.choicePoint}`, ''].join('\n'))
    .join('\n');

  return `${header}${body}`.trimEnd();
}
```

- [ ] **Step 4: Implement export button**

Create `src/components/ExportStoryButton.tsx`:

```tsx
import { buildStoryExportText } from '../game/exportStory';
import type { SavedStory } from '../game/types';

interface ExportStoryButtonProps {
  story: SavedStory;
}

export default function ExportStoryButton({ story }: ExportStoryButtonProps) {
  function exportStory() {
    const blob = new Blob([buildStoryExportText(story)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${story.config.title || 'story'}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className="secondary-button" onClick={exportStory}>
      导出故事
    </button>
  );
}
```

Modify `src/pages/GameReaderPage.tsx` to import and render the button in the topbar:

```tsx
import ExportStoryButton from '../components/ExportStoryButton';
```

Replace the topbar span with:

```tsx
<div className="topbar-actions">
  <span>第 {currentStory.state.turn} / {currentStory.state.maxTurns} 回合</span>
  <ExportStoryButton story={currentStory} />
</div>
```

- [ ] **Step 5: Add export button styling**

Append to `src/styles.css`:

```css
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.secondary-button {
  background: transparent;
  color: #20201d;
  border: 1px solid #deded8;
}
```

- [ ] **Step 6: Run tests**

Run: `npm test -- src/game/exportStory.test.ts src/pages/GameReaderPage.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit export feature**

```bash
git add src/game/exportStory.ts src/game/exportStory.test.ts src/components/ExportStoryButton.tsx src/pages/GameReaderPage.tsx src/styles.css
git commit -m "feat: add story export"
```

---

### Task 10: Full Verification and Local Playtest

**Files:**
- Modify: files found by verification only if tests reveal defects.

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: TypeScript and Vite build PASS.

- [ ] **Step 3: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL.

- [ ] **Step 4: Manual browser verification**

Open the Vite URL in the browser and verify:

- `/create` shows the independent creation page.
- Submitting sample inputs starts story generation.
- `/play/:storyId` shows the independent reader page.
- The reader has a bottom input, novel prose layout, and right sidebar.
- Rejected actions do not advance the turn count.
- Valid actions append new prose.
- Refreshing the reader page reloads the saved story.
- Export downloads a text file that does not include the API key.

- [ ] **Step 5: Clean up temporary preview artifacts**

Remove preview-only files if they are no longer needed:

```bash
git status --short
```

If present and not needed, delete:

```text
.superpowers/
create-story.html
game-reader.html
story-generator-preview.html
```

Use PowerShell `Remove-Item -LiteralPath <path>` only after confirming these are still untracked preview artifacts.

- [ ] **Step 6: Commit verification fixes or cleanup**

If files changed:

```bash
git add .
git commit -m "chore: verify story generator MVP"
```

If no files changed, do not create an empty commit.

