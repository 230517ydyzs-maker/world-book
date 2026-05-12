import type { GameState, StoryConfig, TurnLog } from './types';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

const jsonContract = `只输出 JSON，不要输出 Markdown。JSON 字段必须包含 verdict, verdict_reason, story_text, choice_point, state_patch。verdict 只能是 allowed, allowed_with_cost, failed_forward, rejected。verdict_reason、story_text、choice_point 必须是字符串；choice_point 可以在同一个字符串里写 1-3 个建议方向，但玩家仍可自由输入行动。`;

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
