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
