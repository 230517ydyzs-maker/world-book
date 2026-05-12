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
          <p key={npc.name}><strong>{npc.name}</strong>：{npc.attitude}</p>
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
