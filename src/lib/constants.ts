// App constants
export const RECORDING_DURATION = 5000; // 5 seconds
export const PROGRESS_UPDATE_INTERVAL = 100; // milliseconds
export const IMAGE_BLUR_DURATION = 5000; // 5 seconds
export const SUCCESS_DELAY = 1500; // milliseconds
export const FAILURE_DELAY = 3000; // milliseconds

// Test timing constants
export const IDEAL_RESPONSE_TIME = 2500; // 2.5 seconds for Salzburg test
export const MAX_ACCEPTABLE_TIME = 5000; // 5 seconds

// Enums for better type safety
export enum RecordingState {
  IDLE = 'idle',
  RECORDING = 'recording',
  VALIDATING = 'validating'
}

export enum ValidationState {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILURE = 'failure'
}

export enum AppScreen {
  START = 'start',
  EYE_INSTRUCTION = 'eye-instruction',
  MAIN = 'main',
  REPORT = 'report'
}

export enum VisualAcuityLevel {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  NORMAL = 'Normal',
  BORDERLINE = 'Borderline',
  BELOW_NORMAL = 'Below Normal'
}

export enum EyeTestingPhase {
  LEFT_EYE = 'left-eye',
  RIGHT_EYE = 'right-eye',
  BOTH_EYES = 'both-eyes'
}