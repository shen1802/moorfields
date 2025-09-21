'use client';

import { validateAudio } from '@/ai/flows/validate-audio';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecording } from '@/hooks/use-audio-recording';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { generateSalzburgReport, PerformanceMetric, SalzburgReport } from '@/lib/salzburg-report';
import { RecordingState, ValidationState, AppScreen, SUCCESS_DELAY, FAILURE_DELAY } from '@/lib/constants';
import { blobToBase64 } from '@/lib/audio-utils';
import { useEffect, useState } from 'react';

// UI Components
import { StartScreen } from './start-screen';
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
  
  // Image state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [imageBlurAnimation, setImageBlurAnimation] = useState(false);
  
  // Performance tracking state
  const [shownImages, setShownImages] = useState<Set<number>>(new Set([0]));
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [currentImageStartTime, setCurrentImageStartTime] = useState<number>(0);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [salzburgReport, setSalzburgReport] = useState<SalzburgReport | null>(null);

  const { toast } = useToast();
  const { startRecording, cleanup } = useAudioRecording();
  const currentImage = PlaceHolderImages[currentImageIndex];

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
        blurClearTime: 5000
      };
      
      setPerformanceMetrics(prev => {
        const newMetrics = [...prev, metric];
        
        // Check if test is complete
        if (newMetrics.length >= PlaceHolderImages.length) {
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
        
        return newMetrics;
      });
      
      setRecordingState(RecordingState.IDLE);
      setProgress(0);
      
      // Advance to next image if not complete
      const currentMetricsCount = performanceMetrics.length + 1;
      if (currentMetricsCount < PlaceHolderImages.length) {
        setTimeout(() => {
          advanceToNextImage();
        }, validationSuccess ? SUCCESS_DELAY : FAILURE_DELAY);
      }
    }
  };

  // Advance to next image
  const advanceToNextImage = () => {
    setShownImages(currentShownImages => {
      if (currentShownImages.size >= PlaceHolderImages.length) {
        const report = generateSalzburgReport(performanceMetrics);
        if (report) {
          setSalzburgReport(report);
          setIsTestComplete(true);
        }
        return currentShownImages;
      }

      let nextIndex = (currentImageIndex + 1) % PlaceHolderImages.length;
      
      while (currentShownImages.has(nextIndex)) {
        nextIndex = (nextIndex + 1) % PlaceHolderImages.length;
        if (nextIndex === currentImageIndex) {
          const report = generateSalzburgReport(performanceMetrics);
          if (report) {
            setSalzburgReport(report);
            setIsTestComplete(true);
          }
          return currentShownImages;
        }
      }
      
      // Update all states synchronously for the next image
      setCurrentImageIndex(nextIndex);
      setValidationState(ValidationState.PENDING);
      setTranscribedText(null);
      setImageBlurAnimation(true);
      setCurrentImageStartTime(Date.now());
      
      // Start recording for the next image after state updates
      setTimeout(() => {
        startRecordingForImage(nextIndex);
      }, 200); // Longer delay to ensure all state updates are processed
      
      return new Set([...currentShownImages, nextIndex]);
    });
  };

  // Reset app state
  const resetApp = () => {
    setCurrentImageIndex(0);
    setSessionResults([]);
    setTranscribedText(null);
    setValidationState(ValidationState.PENDING);
    setAppScreen(AppScreen.START);
    setHasStarted(false);
    setProgress(0);
    setImageBlurAnimation(false);
    setShownImages(new Set([0]));
    setPerformanceMetrics([]);
    setCurrentImageStartTime(0);
    setIsTestComplete(false);
    setSalzburgReport(null);
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
        (progress) => setProgress(progress),
        (audioBlob) => processAudio(audioBlob, imageIndex, recordingStartTime), // Pass start time
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
    setImageBlurAnimation(true);
    setCurrentImageStartTime(Date.now());
    setTimeout(() => {
      startRecordingForImage(0);
    }, 100);
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
      />
    </div>
  );
}
