import { useState, type ReactNode } from 'react';
import type { GameState, PlayerCharacter } from '../game/types';

interface SidebarStatePanelProps {
  side: 'left' | 'right';
  character: PlayerCharacter;
  worldSetting: string;
  rules: string[];
  state: GameState;
}

type SidebarSection =
  | 'characterCard'
  | 'identity'
  | 'abilities'
  | 'weaknesses'
  | 'worldConfig'
  | 'worldSetting'
  | 'rules'
  | 'worldMemory'
  | 'npc'
  | 'clues'
  | 'status';

function listText(items: string[]): string {
  return items.join('、') || '暂无';
}

function SidebarGroup({
  id,
  title,
  openSections,
  toggle,
  children
}: {
  id: SidebarSection;
  title: string;
  openSections: Set<SidebarSection>;
  toggle: (section: SidebarSection) => void;
  children: ReactNode;
}) {
  const isOpen = openSections.has(id);

  return (
    <section className="sidebar-group">
      <button
        type="button"
        className="sidebar-group-title"
        aria-expanded={isOpen}
        onClick={() => toggle(id)}
      >
        {title}
      </button>
      {isOpen ? <div className="sidebar-group-body">{children}</div> : null}
    </section>
  );
}

function SidebarBlock({
  id,
  title,
  openSections,
  toggle,
  children
}: {
  id: SidebarSection;
  title: string;
  openSections: Set<SidebarSection>;
  toggle: (section: SidebarSection) => void;
  children: ReactNode;
}) {
  const isOpen = openSections.has(id);

  return (
    <section className="sidebar-block">
      <button
        type="button"
        className="sidebar-block-title"
        aria-expanded={isOpen}
        onClick={() => toggle(id)}
      >
        {title}
      </button>
      {isOpen ? <div className="sidebar-block-body">{children}</div> : null}
    </section>
  );
}

export default function SidebarStatePanel({ side, character, worldSetting, rules, state }: SidebarStatePanelProps) {
  const [openSections, setOpenSections] = useState<Set<SidebarSection>>(
    () => new Set(['status'])
  );

  function toggle(section: SidebarSection) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }

  return (
    <aside
      className={`sidebar sidebar-${side}`}
      aria-label={side === 'left' ? '左侧故事信息' : '右侧故事信息'}
    >
      {side === 'left' ? (
        <>
        <SidebarBlock id="characterCard" title="角色卡" openSections={openSections} toggle={toggle}>
          <SidebarGroup id="identity" title="身份" openSections={openSections} toggle={toggle}>
            <p>{character.name}，{character.identity}</p>
            <p>目标：{character.goal}</p>
          </SidebarGroup>
          <SidebarGroup id="abilities" title="能力" openSections={openSections} toggle={toggle}>
            <p>{listText(character.abilities)}</p>
          </SidebarGroup>
          <SidebarGroup id="weaknesses" title="弱点" openSections={openSections} toggle={toggle}>
            <p>{listText(character.weaknesses)}</p>
          </SidebarGroup>
        </SidebarBlock>
        <SidebarBlock id="worldConfig" title="世界设定" openSections={openSections} toggle={toggle}>
          <SidebarGroup id="worldSetting" title="世界观" openSections={openSections} toggle={toggle}>
            <p>{worldSetting || '暂无'}</p>
          </SidebarGroup>
          <SidebarGroup id="rules" title="世界规则" openSections={openSections} toggle={toggle}>
            {rules.length ? rules.map((rule) => <p key={rule}>{rule}</p>) : <p>暂无</p>}
          </SidebarGroup>
        </SidebarBlock>
        </>
      ) : (
        <>
        <SidebarGroup id="worldMemory" title="世界记忆" openSections={openSections} toggle={toggle}>
          <p>{listText(state.worldMemory)}</p>
        </SidebarGroup>
        <SidebarGroup id="npc" title="人物" openSections={openSections} toggle={toggle}>
          {state.npcRegistry.length ? state.npcRegistry.map((npc) => (
            <div key={npc.name} className="sidebar-record">
              <p><strong>{npc.name}</strong>：{npc.attitude}</p>
              <p>{listText(npc.knownFacts)}</p>
            </div>
          )) : <p>暂无</p>}
        </SidebarGroup>
        <SidebarGroup id="clues" title="线索" openSections={openSections} toggle={toggle}>
          <p>{state.clues.join('、') || '暂无'}</p>
        </SidebarGroup>
        <SidebarGroup id="status" title="状态" openSections={openSections} toggle={toggle}>
          <p>地点：{state.currentLocation}</p>
          <p>危险度：{state.dangerLevel}</p>
          <p>回合：{state.turn} / {state.maxTurns}</p>
        </SidebarGroup>
        </>
      )}
    </aside>
  );
}
