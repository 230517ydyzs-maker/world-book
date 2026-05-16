export type DangerLevel = 'low' | 'medium' | 'high';

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
  storyText: string;
  choicePoint: string;
  statePatch: AiStatePatch;
  createdAt: string;
}

export interface AiTurnResponse {
  story_text: string;
  choice_point: string;
  state_patch: AiStatePatch;
}

export interface SavedStory {
  config: StoryConfig;
  state: GameState;
  turns: TurnLog[];
}
