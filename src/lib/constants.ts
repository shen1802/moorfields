// Timing constants (in milliseconds)
export const RECORDING_DURATION = 5000;
export const PROGRESS_UPDATE_INTERVAL = 100;
export const IMAGE_BLUR_DURATION = 5000;
export const SUCCESS_DELAY = 1500;
export const FAILURE_DELAY = 3000;

// Salzburg test timing constants
export const IDEAL_RESPONSE_TIME = 2500; // 2.5 seconds
export const MAX_ACCEPTABLE_TIME = 5000; // 5 seconds

// Test configuration
export const STANDARD_IMAGES_PER_PHASE = 13;
export const TOTAL_EYE_PHASES = 3;

// Application states
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

export enum EyeTestingPhase {
  LEFT_EYE = 'left-eye',
  RIGHT_EYE = 'right-eye',
  BOTH_EYES = 'both-eyes'
}

export enum VisualAcuityLevel {
  EXCELLENT = 'Excellent',
  GOOD = 'Good',
  NORMAL = 'Normal',
  BORDERLINE = 'Borderline',
  BELOW_NORMAL = 'Below Normal'
}

// Helper functions for enum conversions
export const getEyePhaseDisplayName = (phase: EyeTestingPhase): string => {
  const displayNames = {
    [EyeTestingPhase.LEFT_EYE]: 'Left Eye',
    [EyeTestingPhase.RIGHT_EYE]: 'Right Eye',
    [EyeTestingPhase.BOTH_EYES]: 'Both Eyes',
  };
  return displayNames[phase] || 'Unknown';
};

export const getEyeInstructions = (phase: EyeTestingPhase): string => {
  const instructions = {
    [EyeTestingPhase.LEFT_EYE]: 'Cover your right eye. Look with left eye only.',
    [EyeTestingPhase.RIGHT_EYE]: 'Cover your left eye. Look with right eye only.',
    [EyeTestingPhase.BOTH_EYES]: 'Use both eyes normally.',
  };
  return instructions[phase] || '';
};