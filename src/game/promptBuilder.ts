import type { GameState, StoryConfig, TurnLog } from './types';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

const jsonContract = [
  '只输出 JSON，不要输出 Markdown。',
  '必须是可被 JSON.parse 直接解析的合法 JSON：字段之间必须有英文逗号，字符串里的换行必须写成 \\n。',
  'JSON 字段必须包含 story_text, choice_point, state_patch。',
  'story_text、choice_point 必须是字符串。',
  'story_text 只能写小说正文，不要写行动建议、状态总结或系统提示。',
  'choice_point 只写 1-3 个行动建议方向；不要把建议方向混进 story_text。'
].join('\n');

const proseRules = [
  '先在内部完成导演层思考，但不要输出导演层；最终只输出 JSON，story_text 只写小说层正文。',
  '写作规则：避免总结式、解说式写法。',
  '每回合只推进一个主要事件，不要把调查、战斗、逃亡、谈判全部塞进同一回合。',
  '通过动作、环境、对话和可见细节呈现信息，少用抽象判断和局势说明。',
  '不要使用“显然、与此同时、然而、他意识到、这意味着、局势变得、命运的齿轮”等模板化连接或总结句。',
  '不要频繁重复同一能力名、神器名、血脉名、阵营名；必须提及时，优先写外在表现。',
  '承接玩家动作后，写现场细节、具体后果或阻碍，最后停在自然的悬念或行动空隙。',
  '玩家输入的任何行动都已经发生，不要拒绝、拦截或要求玩家重新输入。',
  'NPC 连续性规则：必须参考当前 NPC 状态；已出现 NPC 不得无故消失或被遗忘；NPC 的态度、已知情报应影响行动结果。',
  '线索规则：必须优先复用已有线索；当玩家行动涉及线索时，线索必须影响结果；不得凭空遗忘线索。',
  '世界规则用于塑造后果和代价，不用于否定玩家行动。',
  '每 3 回合至少改变一次叙事节奏，可在调查、对话、行动、停顿、误判、局部代价之间切换。',
  '禁止连续两回合使用同一种结尾方式，不要每次都用疑问、突发声响、黑影或重大揭示收尾。',
  '最近 3 回合出现过的核心意象，本回合尽量避开，或换成更具体的动作、物件、身体反应。',
  '不要每回合都抛出重大设定发现；允许小推进、小阻碍、小误会和人物态度变化。'
].join('\n');

const systemPrompt = `你是互动小说游戏的故事导演和状态记录器。\n${jsonContract}\n${proseRules}`;

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
  const npcBrief = state.npcRegistry
    .map((npc) => {
      const facts = npc.knownFacts.length ? `：${npc.knownFacts.join('、')}` : '';
      return `${npc.name}(${npc.attitude}${facts})`;
    })
    .join('、');

  return [
    `回合：${state.turn}/${state.maxTurns}`,
    `地点：${state.currentLocation}`,
    `危险度：${state.dangerLevel}`,
    `结局进度：${state.endingProgress}`,
    `玩家状态：${state.playerStatus.join('、') || '无'}`,
    `线索：${state.clues.join('、') || '无'}`,
    `世界记忆：${state.worldMemory.join('、') || '无'}`,
    `NPC：${npcBrief || '无'}`
  ].join('\n');
}

function recentHistory(turns: TurnLog[]): string {
  return turns
    .slice(-5)
    .map((turn) => `第 ${turn.turn} 回合\n玩家：${turn.playerAction}\n正文：${turn.storyText}\n抉择点：${turn.choicePoint}`)
    .join('\n\n');
}

function turnInstruction(state: GameState): string {
  const isFinalTurn = state.turn + 1 >= state.maxTurns;
  if (isFinalTurn) {
    return '这是最后一个回合。请把本次玩家行动推进为故事结局，story_text 写完整收束段落，choice_point 必须返回空字符串，不要生成下一步抉择。';
  }

  return '无论玩家输入什么，都按已经发生的行动继续写剧情。可以通过后果、代价、误会或阻碍来保持故事张力。';
}

export function buildOpeningPrompt(story: StoryConfig): ChatMessage[] {
  return [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: `${storyBrief(story)}\n\n请生成开篇。player_action 视为“故事开始”。正文应是小说段落，末尾必须有抉择点。`
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
      content: systemPrompt
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
        turnInstruction(state)
      ].join('\n')
    }
  ];
}
