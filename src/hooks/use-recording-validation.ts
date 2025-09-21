import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecording } from '@/hooks/use-audio-recording';
import { validateAudio } from '@/ai/flows/validate-audio';
import { blobToBase64 } from '@/lib/audio-utils';
import { RecordingState, ValidationState, SUCCESS_DELAY, FAILURE_DELAY } from '@/lib/constants';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PerformanceMetric } from '@/lib/salzburg-report';

type ValidationResult = {
  image: { description: string };
  matches: boolean;
  transcribedText: string;
};

type SessionResult = ValidationResult;

interface UseRecordingValidationProps {
  updateRecording: (updates: { state?: RecordingState; progress?: number }) => void;
  updateValidation: (updates: { state?: ValidationState; transcribedText?: string | null }) => void;
  updateImage: (updates: { currentIndex?: number; startTime?: number; blurAnimation?: boolean }) => void;
  addSessionResult: (result: SessionResult) => void;
  addPerformanceMetric: (metric: PerformanceMetric) => void;
  onValidationComplete?: (isSuccess: boolean) => void;
  currentEyePhase: string;
}

export function useRecordingValidation({
  updateRecording,
  updateValidation,
  updateImage,
  addSessionResult,
  addPerformanceMetric,
  onValidationComplete,
  currentEyePhase,
}: UseRecordingValidationProps) {
  const { toast } = useToast();
  const { startRecording, cleanup } = useAudioRecording();
  
  // Use a ref to hold the validation complete callback
  const validationCompleteCallbackRef = useRef<((isSuccess: boolean) => void) | null>(onValidationComplete || null);

  const processAudio = useCallback(async (
    audioBlob: Blob,
    imageIndex: number,
    recordingStartTime: number
  ) => {
    updateRecording({ state: RecordingState.VALIDATING, progress: 100 });
    updateValidation({ state: ValidationState.PENDING, transcribedText: null });
    
    let validationSuccess = false;
    let transcribedText = '';

    try {
      const base64Audio = await blobToBase64(audioBlob);
      if (!base64Audio) throw new Error('Failed to convert audio to base64');

      const processingImage = PlaceHolderImages[imageIndex];
      const goldenStandard = processingImage.description.toLowerCase().trim();
      
      const result = await validateAudio({
        audioDataUri: base64Audio,
        textToMatch: goldenStandard,
      });

      transcribedText = result.transcribedText;
      updateValidation({ 
        state: result.matches ? ValidationState.SUCCESS : ValidationState.FAILURE, 
        transcribedText 
      });

      // Add session result
      addSessionResult({ 
        image: processingImage, 
        matches: result.matches, 
        transcribedText 
      });

      validationSuccess = result.matches;
      
      // Show toast
      if (result.matches) {
        toast({
          title: 'Validation Successful!',
          description: 'The spoken audio matches the text.',
          className: 'bg-green-100 dark:bg-green-900',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Validation Failed',
          description: `Expected: ${goldenStandard}, Got: ${result.transcribedText}`,
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      updateValidation({ state: ValidationState.FAILURE, transcribedText: null });
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: `Could not validate the audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      // Record performance metric
      const processingImage = PlaceHolderImages[imageIndex];
      const responseTime = Date.now() - recordingStartTime;
      const metric: PerformanceMetric = {
        imageIndex,
        imageName: processingImage.description,
        startTime: recordingStartTime,
        responseTime,
        isCorrect: validationSuccess,
        transcribedText,
        blurClearTime: 5000,
        eyeTestingPhase: currentEyePhase,
        wasSkipped: false
      };
      
      addPerformanceMetric(metric);
      updateRecording({ state: RecordingState.IDLE });
      
      // Notify completion with delay
      setTimeout(() => {
        validationCompleteCallbackRef.current?.(validationSuccess);
      }, validationSuccess ? SUCCESS_DELAY : FAILURE_DELAY);
    }
  }, [updateRecording, updateValidation, addSessionResult, addPerformanceMetric, onValidationComplete, currentEyePhase, toast]);

  const startRecordingForImage = useCallback(async (imageIndex: number) => {
    cleanup();
    updateRecording({ state: RecordingState.IDLE, progress: 0 });
    
    const recordingStartTime = Date.now();
    updateImage({ startTime: recordingStartTime, blurAnimation: true });

    setTimeout(() => {
      updateRecording({ state: RecordingState.RECORDING, progress: 0 });
      
      startRecording(
        (progress) => {
          updateRecording({ state: RecordingState.RECORDING, progress });
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
          updateRecording({ state: RecordingState.IDLE, progress: 0 });
        }
      );
    }, 100);
  }, [cleanup, updateRecording, updateImage, startRecording, processAudio, toast]);

  const cleanupRecording = useCallback(() => {
    cleanup();
    updateRecording({ state: RecordingState.IDLE, progress: 0 });
  }, [cleanup, updateRecording]);

  const setValidationCompleteCallback = useCallback((callback: (isSuccess: boolean) => void) => {
    validationCompleteCallbackRef.current = callback;
  }, []);

  return {
    startRecordingForImage,
    cleanupRecording,
    setValidationCompleteCallback,
  };
}