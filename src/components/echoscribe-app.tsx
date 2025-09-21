'use client';

import { validateAudio } from '@/ai/flows/validate-audio';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecording } from '@/hooks/use-audio-recording';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { generateSalzburgReport, PerformanceMetric, SalzburgReport } from '@/lib/salzburg-report';
import { RecordingState, ValidationState, AppScreen, SUCCESS_DELAY, FAILURE_DELAY, EyeTestingPhase } from '@/lib/constants';
import { blobToBase64 } from '@/lib/audio-utils';
import { useEffect, useState } from 'react';

// UI Components
import { StartScreen } from './start-screen';
import { EyeInstructionScreen } from './eye-instruction-screen';
import { MainTestScreen } from './main-test-screen';
import { SessionReport } from './session-report';
import { SalzburgReportUI } from './salzburg-report-ui';

type ValidationResult = {
  image: { description: string };
  matches: boolean;
  transcribedText: string;
};

export default function EchoScribeApp() {
  // App state
  const [hasStarted, setHasStarted] = useState(false);
  const [appScreen, setAppScreen] = useState<AppScreen>(AppScreen.START);
  const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.IDLE);
  const [validationState, setValidationState] = useState<ValidationState>(ValidationState.PENDING);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [sessionResults, setSessionResults] = useState<ValidationResult[]>([]);
  
  // Eye testing state
  const [currentEyePhase, setCurrentEyePhase] = useState<EyeTestingPhase>(EyeTestingPhase.LEFT_EYE);
  const [eyePhaseImageIndex, setEyePhaseImageIndex] = useState(0);
  const [isSkipping, setIsSkipping] = useState(false);
  
  // Image state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [imageBlurAnimation, setImageBlurAnimation] = useState(false);
  
  // Performance tracking state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [currentImageStartTime, setCurrentImageStartTime] = useState<number>(0);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [salzburgReport, setSalzburgReport] = useState<SalzburgReport | null>(null);

  const { toast } = useToast();
  const { startRecording, cleanup } = useAudioRecording();
  const currentImage = PlaceHolderImages[currentImageIndex];

  // Complete state reset for recording and UI
  const resetRecordingState = () => {
    cleanup();
    setRecordingState(RecordingState.IDLE);
    setProgress(0);
    setValidationState(ValidationState.PENDING);
    setTranscribedText(null);
    setImageBlurAnimation(false);
    setCurrentImageStartTime(0);
    setIsSkipping(false);
  };

  // Clean recording state without full UI reset
  const cleanRecordingOnly = () => {
    cleanup();
    setRecordingState(RecordingState.IDLE);
    setProgress(0);
  };

  // Helper function to get eye phase display name
  const getEyePhaseDisplayName = (phase: EyeTestingPhase): string => {
    switch (phase) {
      case EyeTestingPhase.LEFT_EYE:
        return 'Left Eye';
      case EyeTestingPhase.RIGHT_EYE:
        return 'Right Eye';
      case EyeTestingPhase.BOTH_EYES:
        return 'Both Eyes';
      default:
        return 'Unknown';
    }
  };

  // Skip current test
  const skipCurrentTest = () => {
    // Only allow skipping if not currently validating or already skipping
    if (recordingState === RecordingState.VALIDATING || isSkipping) {
      return;
    }
    
    setIsSkipping(true);
    
    // Skip to next phase instead of next image
    skipToNextPhase();
  };

  // Skip entire current phase
  const skipToNextPhase = () => {
    // Immediate and complete cleanup
    resetRecordingState();
    
    const totalImagesPerPhase = PlaceHolderImages.length;
    
    // Create skipped metrics for all remaining images in current phase
    const remainingImages = totalImagesPerPhase - eyePhaseImageIndex;
    const skippedMetrics: PerformanceMetric[] = [];
    
    console.log('⏭️ Skipping phase:', {
      currentEyePhase,
      eyePhaseImageIndex,
      totalImagesPerPhase,
      remainingImages
    });
    
    for (let i = eyePhaseImageIndex; i < totalImagesPerPhase; i++) {
      const imageIndex = i;
      const metric: PerformanceMetric = {
        imageIndex,
        imageName: PlaceHolderImages[imageIndex].description,
        startTime: Date.now(),
        responseTime: 0,
        isCorrect: false,
        transcribedText: 'Phase Skipped',
        blurClearTime: 5000,
        eyeTestingPhase: currentEyePhase,
        wasSkipped: true
      };
      skippedMetrics.push(metric);
    }
    
    console.log('📝 Generated skipped metrics:', skippedMetrics.length, 'for phase:', currentEyePhase);
    
    setPerformanceMetrics(prev => {
      const newMetrics = [...prev, ...skippedMetrics];
      return newMetrics;
    });
    
    toast({
      title: `${getEyePhaseDisplayName(currentEyePhase)} Phase Skipped`,
      description: 'Moving to next testing phase...',
      className: 'bg-yellow-100 dark:bg-yellow-900',
    });
    
    // Move to next phase
    setTimeout(() => {
      moveToNextPhase();
      setIsSkipping(false); // Reset skipping state
    }, 1000);
  };

  // Move to next phase or complete test
  const moveToNextPhase = () => {
    let nextPhase: EyeTestingPhase | null = null;
    
    switch (currentEyePhase) {
      case EyeTestingPhase.LEFT_EYE:
        nextPhase = EyeTestingPhase.RIGHT_EYE;
        break;
      case EyeTestingPhase.RIGHT_EYE:
        nextPhase = EyeTestingPhase.BOTH_EYES;
        break;
      case EyeTestingPhase.BOTH_EYES:
        // All phases complete - show report
        setTimeout(() => {
          const report = generateSalzburgReport(performanceMetrics);
          if (report) {
            setSalzburgReport(report);
            setIsTestComplete(true);
            setAppScreen(AppScreen.REPORT);
          }
        }, 500);
        return;
    }
    
    if (nextPhase) {
      // Complete state reset for next phase
      resetRecordingState();
      
      // Show instruction screen for next phase
      setCurrentEyePhase(nextPhase);
      setAppScreen(AppScreen.EYE_INSTRUCTION);
      setEyePhaseImageIndex(0);
      setCurrentImageIndex(0);
    }
  };

  // Process recorded audio
  const processAudio = async (audioBlob: Blob, imageIndexAtRecording: number, recordingStartTime?: number) => {
    setRecordingState(RecordingState.VALIDATING);
    setTranscribedText(null);
    let validationSuccess = false;
    let actualTranscribedText = '';
    
    // Use passed start time or fallback to state
    const actualStartTime = recordingStartTime || currentImageStartTime;
    
    try {
      const base64Audio = await blobToBase64(audioBlob);
      if (!base64Audio) throw new Error('Failed to convert audio to base64');

      const processingImage = PlaceHolderImages[imageIndexAtRecording];
      const goldenStandard = processingImage.description.toLowerCase().trim();
      
      const result = await validateAudio({
        audioDataUri: base64Audio,
        textToMatch: goldenStandard,
      });

      // Store the transcribed text for later use
      actualTranscribedText = result.transcribedText;
      setTranscribedText(result.transcribedText);

      // Add result to session results
      setSessionResults(prev => [...prev, { 
        image: processingImage, 
        matches: result.matches, 
        transcribedText: result.transcribedText 
      }]);

      if (result.matches) {
        setValidationState(ValidationState.SUCCESS);
        validationSuccess = true;
        toast({
          title: 'Validation Successful!',
          description: 'The spoken audio matches the text.',
          className: 'bg-green-100 dark:bg-green-900',
        });
      } else {
        setValidationState(ValidationState.FAILURE);
        toast({
          variant: 'destructive',
          title: 'Validation Failed',
          description: `Expected: ${goldenStandard}, Got: ${result.transcribedText}`,
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      setValidationState(ValidationState.FAILURE);
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: `Could not validate the audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      // Record performance metric using the actual transcribed text and correct start time
      const processingImage = PlaceHolderImages[imageIndexAtRecording];
      const responseTime = Date.now() - actualStartTime;
      const metric: PerformanceMetric = {
        imageIndex: imageIndexAtRecording,
        imageName: processingImage.description,
        startTime: actualStartTime,
        responseTime,
        isCorrect: validationSuccess,
        transcribedText: actualTranscribedText, // Use the actual transcribed text, not state
        blurClearTime: 5000,
        eyeTestingPhase: currentEyePhase,
        wasSkipped: false
      };
      
      console.log('💾 Saving metric with eyeTestingPhase:', currentEyePhase);
      
      setPerformanceMetrics(prev => {
        const newMetrics = [...prev, metric];
        
        // Check if all phases are complete
        const totalImagesPerPhase = PlaceHolderImages.length;
        const totalExpectedMetrics = totalImagesPerPhase * 3; // 3 phases
        if (newMetrics.length >= totalExpectedMetrics) {
          setTimeout(() => {
            const report = generateSalzburgReport(newMetrics);
            if (report) {
              setSalzburgReport(report);
              setIsTestComplete(true);
              setAppScreen(AppScreen.REPORT);
            }
          }, 500);
          
          setRecordingState(RecordingState.IDLE);
          setProgress(0);
          return newMetrics;
        }
        
        // Schedule advancement using the newMetrics (not the stale state)
        setTimeout(() => {
          advanceToNextImageWithMetrics(newMetrics);
        }, validationSuccess ? SUCCESS_DELAY : FAILURE_DELAY);
        
        return newMetrics;
      });
      
      setRecordingState(RecordingState.IDLE);
      setProgress(0);
    }
  };

  // Advance to next image using provided metrics (to avoid stale state issues)
  const advanceToNextImageWithMetrics = (metrics: PerformanceMetric[]) => {
    // Check how many images we've completed in the current phase
    const currentPhaseMetrics = metrics.filter(m => m.eyeTestingPhase === currentEyePhase);
    const nextEyePhaseImageIndex = currentPhaseMetrics.length;
    const totalImagesPerPhase = PlaceHolderImages.length;
    
    console.log('🔄 advanceToNextImageWithMetrics called:', {
      currentEyePhase,
      currentPhaseMetrics: currentPhaseMetrics.length,
      nextEyePhaseImageIndex,
      totalImagesPerPhase,
      currentImageIndex,
      totalMetrics: metrics.length
    });
    
    if (nextEyePhaseImageIndex >= totalImagesPerPhase) {
      // Current phase is complete - move to next phase
      console.log('✅ Phase complete, moving to next phase');
      moveToNextPhase();
    } else {
      // Continue with next image in current phase
      // For eye testing, we cycle through the same images for each phase
      const nextImageIndex = nextEyePhaseImageIndex % totalImagesPerPhase;
      
      console.log('➡️ Moving to next image in same phase:', {
        nextEyePhaseImageIndex,
        nextImageIndex
      });
      
      // Clean recording state only
      cleanRecordingOnly();
      
      setEyePhaseImageIndex(nextEyePhaseImageIndex);
      setCurrentImageIndex(nextImageIndex);
      setValidationState(ValidationState.PENDING);
      setTranscribedText(null);
      setImageBlurAnimation(true);
      setCurrentImageStartTime(Date.now());
      
      // Start recording for the next image after state updates
      setTimeout(() => {
        startRecordingForImage(nextImageIndex);
      }, 200);
    }
  };

  // Advance to next image
  const advanceToNextImage = () => {
    // Use current performanceMetrics state
    advanceToNextImageWithMetrics(performanceMetrics);
  };

  // Reset app state
  const resetApp = () => {
    resetRecordingState();
    setCurrentImageIndex(0);
    setSessionResults([]);
    setAppScreen(AppScreen.START);
    setHasStarted(false);
    setPerformanceMetrics([]);
    setIsTestComplete(false);
    setSalzburgReport(null);
    setCurrentEyePhase(EyeTestingPhase.LEFT_EYE);
    setEyePhaseImageIndex(0);
    setIsSkipping(false);
  };

  // Start recording for specific image
  const startRecordingForImage = async (imageIndex: number) => {
    // Always ensure clean state before starting
    cleanup();
    setProgress(0);
    setRecordingState(RecordingState.IDLE);
    
    // Record the actual start time when recording begins
    const recordingStartTime = Date.now();
    setCurrentImageStartTime(recordingStartTime);

    // Start recording after ensuring cleanup and reset
    setTimeout(() => {
      setRecordingState(RecordingState.RECORDING);
      
      startRecording(
        (progress) => {
          setProgress(progress);
        },
        (audioBlob) => {
          processAudio(audioBlob, imageIndex, recordingStartTime);
        },
        (error) => {
          console.error('Recording error:', error);
          toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description: 'Please allow microphone access in your browser settings to use this app.',
          });
          setRecordingState(RecordingState.IDLE);
          setProgress(0);
        }
      );
    }, 100); // Sufficient delay for cleanup
  };

  // Start app
  const handleStart = () => {
    setHasStarted(true);
    setAppScreen(AppScreen.EYE_INSTRUCTION);
  };

  // Start eye testing phase
  const startEyePhase = () => {
    // Ensure clean state before starting
    resetRecordingState();
    
    setAppScreen(AppScreen.MAIN);
    setImageBlurAnimation(true);
    setCurrentImageStartTime(Date.now());
    
    setTimeout(() => {
      startRecordingForImage(0);
    }, 1000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Render different screens based on app state
  if (isTestComplete && salzburgReport) {
    return (
      <SalzburgReportUI
        report={salzburgReport}
        performanceMetrics={performanceMetrics}
        onRestart={() => window.location.reload()}
      />
    );
  }
  
  if (!hasStarted) {
    return <StartScreen onStart={handleStart} />;
  }

  if (appScreen === AppScreen.EYE_INSTRUCTION) {
    return (
      <EyeInstructionScreen
        eyePhase={currentEyePhase}
        onStart={startEyePhase}
        onSkipPhase={skipToNextPhase}
      />
    );
  }

  if (appScreen === AppScreen.REPORT) {
    return (
      <SessionReport
        sessionResults={sessionResults}
        onReset={resetApp}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <MainTestScreen
        currentImage={currentImage}
        recordingState={recordingState}
        validationState={validationState}
        transcribedText={transcribedText}
        progress={progress}
        imageBlurAnimation={imageBlurAnimation}
        currentEyePhase={getEyePhaseDisplayName(currentEyePhase)}
        onSkipTest={skipCurrentTest}
        canSkip={recordingState !== RecordingState.VALIDATING && !isSkipping}
        phaseProgress={`${eyePhaseImageIndex + 1}/${PlaceHolderImages.length}`}
      />
    </div>
  );
}
