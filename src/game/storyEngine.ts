import { createId } from './id';
import { buildOpeningPrompt, buildTurnPrompt, type ChatMessage } from './promptBuilder';
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

export type AiRunner = (messages: ChatMessage[]) => Promise<AiTurnResponse>;

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
  response: AiTurnResponse,
  choicePointOverride?: string
): TurnLog {
  return {
    storyId,
    turn,
    playerAction,
    verdict: response.verdict,
    verdictReason: response.verdict_reason,
    storyText: response.story_text,
    choicePoint: choicePointOverride ?? response.choice_point,
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
  const isFinalAdvancingTurn = advancesTurn && turnNumber >= savedStory.state.maxTurns;
  const log = createTurnLog(
    savedStory.config.id,
    turnNumber,
    playerAction,
    response,
    isFinalAdvancingTurn ? '' : undefined
  );
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
