export type SessionState = 'IDLE' | 'TIMER' | 'SELECTED' | 'NEXT_PROMPT' | 'FINISHED';

export interface AppState {
  currentQuestionIndex: number;
  status: SessionState;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  timerEndAt: number | null; // Timestamp in ms
  answeredIndices: number[];
  skippedIndices: number[];
  lastUpdate: number;
}

export const INITIAL_STATE: AppState = {
  currentQuestionIndex: 0,
  status: 'IDLE',
  selectedOption: null,
  timerEndAt: null,
  answeredIndices: [],
  skippedIndices: [],
  lastUpdate: Date.now(),
};

export const TOTAL_QUESTIONS = 125;
export const TIMER_DURATION_MS = 90 * 1000; // 1 minute 30 seconds
export const SELECTION_DISPLAY_DURATION_MS = 10 * 1000; // 10 seconds
export const NEXT_PROMPT_DURATION_MS = 3 * 1000; // 3 seconds