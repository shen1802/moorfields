import { useState, useCallback } from 'react';
import { AppScreen, RecordingState, ValidationState, EyeTestingPhase, getEyePhaseDisplayName } from '@/lib/constants';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PerformanceMetric, SalzburgReport } from '@/lib/salzburg-report';

type ValidationResult = {
  image: { description: string };
  matches: boolean;
  transcribedText: string;
};

interface AppState {
  // Screen management
  currentScreen: AppScreen;
  hasStarted: boolean;
  
  // Recording state
  recording: {
    state: RecordingState;
    progress: number;
  };
  
  // Validation state
  validation: {
    state: ValidationState;
    transcribedText: string | null;
  };
  
  // Eye testing state
  eyeTest: {
    currentPhase: EyeTestingPhase;
    imageIndex: number;
    phaseImageIndex: number;
    isSkipping: boolean;
  };
  
  // Image state
  image: {
    currentIndex: number;
    startTime: number;
    blurAnimation: boolean;
  };
  
  // Results state
  results: {
    sessionResults: ValidationResult[];
    performanceMetrics: PerformanceMetric[];
    salzburgReport: SalzburgReport | null;
    isTestComplete: boolean;
  };
}

export function useAppState() {
  const [state, setState] = useState<AppState>({
    currentScreen: AppScreen.START,
    hasStarted: false,
    recording: {
      state: RecordingState.IDLE,
      progress: 0,
    },
    validation: {
      state: ValidationState.PENDING,
      transcribedText: null,
    },
    eyeTest: {
      currentPhase: EyeTestingPhase.LEFT_EYE,
      imageIndex: 0,
      phaseImageIndex: 0,
      isSkipping: false,
    },
    image: {
      currentIndex: 0,
      startTime: 0,
      blurAnimation: false,
    },
    results: {
      sessionResults: [],
      performanceMetrics: [],
      salzburgReport: null,
      isTestComplete: false,
    },
  });

  // Simplified state updaters
  const updateScreen = useCallback((screen: AppScreen) => {
    setState(prev => ({ ...prev, currentScreen: screen }));
  }, []);

  const updateRecording = useCallback((updates: Partial<AppState['recording']>) => {
    setState(prev => ({
      ...prev,
      recording: { ...prev.recording, ...updates }
    }));
  }, []);

  const updateValidation = useCallback((updates: Partial<AppState['validation']>) => {
    setState(prev => ({
      ...prev,
      validation: { ...prev.validation, ...updates }
    }));
  }, []);

  const updateEyeTest = useCallback((updates: Partial<AppState['eyeTest']>) => {
    setState(prev => ({
      ...prev,
      eyeTest: { ...prev.eyeTest, ...updates }
    }));
  }, []);

  const updateImage = useCallback((updates: Partial<AppState['image']>) => {
    setState(prev => ({
      ...prev,
      image: { ...prev.image, ...updates }
    }));
  }, []);

  const updateResults = useCallback((updates: Partial<AppState['results']>) => {
    setState(prev => ({
      ...prev,
      results: { ...prev.results, ...updates }
    }));
  }, []);

  const startApp = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasStarted: true,
      currentScreen: AppScreen.EYE_INSTRUCTION,
    }));
  }, []);

  const resetApp = useCallback(() => {
    setState({
      currentScreen: AppScreen.START,
      hasStarted: false,
      recording: {
        state: RecordingState.IDLE,
        progress: 0,
      },
      validation: {
        state: ValidationState.PENDING,
        transcribedText: null,
      },
      eyeTest: {
        currentPhase: EyeTestingPhase.LEFT_EYE,
        imageIndex: 0,
        phaseImageIndex: 0,
        isSkipping: false,
      },
      image: {
        currentIndex: 0,
        startTime: 0,
        blurAnimation: false,
      },
      results: {
        sessionResults: [],
        performanceMetrics: [],
        salzburgReport: null,
        isTestComplete: false,
      },
    });
  }, []);

  const resetRecordingState = useCallback(() => {
    updateRecording({
      state: RecordingState.IDLE,
      progress: 0,
    });
    updateValidation({
      state: ValidationState.PENDING,
      transcribedText: null,
    });
    updateImage({
      blurAnimation: false,
      startTime: 0,
    });
    updateEyeTest({
      isSkipping: false,
    });
  }, [updateRecording, updateValidation, updateImage, updateEyeTest]);

  const getCurrentImage = useCallback(() => {
    return PlaceHolderImages[state.image.currentIndex];
  }, [state.image.currentIndex]);

  const getPhaseProgress = useCallback(() => {
    return `${state.eyeTest.phaseImageIndex + 1}/${PlaceHolderImages.length}`;
  }, [state.eyeTest.phaseImageIndex]);

  return {
    state,
    // State updaters
    updateScreen,
    updateRecording,
    updateValidation,
    updateEyeTest,
    updateImage,
    updateResults,
    // Actions
    startApp,
    resetApp,
    resetRecordingState,
    // Computed values
    getPhaseDisplayName: getEyePhaseDisplayName,
    getCurrentImage,
    getPhaseProgress,
  };
}