import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AppScreen, EyeTestingPhase, getEyePhaseDisplayName } from '@/lib/constants';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { PerformanceMetric, generateSalzburgReport } from '@/lib/salzburg-report';

interface UsePhaseManagementProps {
  currentPhase: EyeTestingPhase;
  phaseImageIndex: number;
  updateScreen: (screen: AppScreen) => void;
  updateEyeTest: (updates: any) => void;
  updateImage: (updates: any) => void;
  updateResults: (updates: any) => void;
  resetRecordingState: () => void;
  getPhaseDisplayName: (phase: EyeTestingPhase) => string;
  performanceMetrics: PerformanceMetric[];
  startRecordingForImage: (imageIndex: number) => void;
}

export function usePhaseManagement({
  currentPhase,
  phaseImageIndex,
  updateScreen,
  updateEyeTest,
  updateImage,
  updateResults,
  resetRecordingState,
  getPhaseDisplayName,
  performanceMetrics,
  startRecordingForImage,
}: UsePhaseManagementProps) {
  const { toast } = useToast();

  const moveToNextPhase = useCallback(() => {
    let nextPhase: EyeTestingPhase | null = null;
    
    switch (currentPhase) {
      case EyeTestingPhase.LEFT_EYE:
        nextPhase = EyeTestingPhase.RIGHT_EYE;
        break;
      case EyeTestingPhase.RIGHT_EYE:
        nextPhase = EyeTestingPhase.BOTH_EYES;
        break;
      case EyeTestingPhase.BOTH_EYES:
        // All phases complete - generate report
        setTimeout(() => {
          const report = generateSalzburgReport(performanceMetrics);
          if (report) {
            updateResults({
              salzburgReport: report,
              isTestComplete: true,
            });
            updateScreen(AppScreen.REPORT);
          }
        }, 500);
        return;
    }
    
    if (nextPhase) {
      resetRecordingState();
      updateEyeTest({
        currentPhase: nextPhase,
        phaseImageIndex: 0,
        imageIndex: 0,
      });
      updateImage({ currentIndex: 0 });
      updateScreen(AppScreen.EYE_INSTRUCTION);
    }
  }, [currentPhase, performanceMetrics, updateScreen, updateEyeTest, updateImage, updateResults, resetRecordingState]);

  const skipPhase = useCallback(() => {
    const totalImagesPerPhase = PlaceHolderImages.length;
    const remainingImages = totalImagesPerPhase - phaseImageIndex;
    
    // Create skipped metrics for remaining images in current phase
    const skippedMetrics: PerformanceMetric[] = [];
    for (let i = phaseImageIndex; i < totalImagesPerPhase; i++) {
      const metric: PerformanceMetric = {
        imageIndex: i,
        imageName: PlaceHolderImages[i].description,
        startTime: Date.now(),
        responseTime: 0,
        isCorrect: false,
        transcribedText: 'Phase Skipped',
        blurClearTime: 5000,
        eyeTestingPhase: currentPhase,
        wasSkipped: true
      };
      skippedMetrics.push(metric);
    }
    
    // Add skipped metrics to results
    updateResults({
      performanceMetrics: [...performanceMetrics, ...skippedMetrics]
    });
    
    toast({
      title: `${getPhaseDisplayName(currentPhase)} Phase Skipped`,
      description: 'Moving to next testing phase...',
      className: 'bg-yellow-100 dark:bg-yellow-900',
    });
    
    setTimeout(() => {
      moveToNextPhase();
    }, 1000);
  }, [currentPhase, phaseImageIndex, performanceMetrics, updateResults, getPhaseDisplayName, toast, moveToNextPhase]);

  const advanceToNextImage = useCallback(() => {
    const currentPhaseMetrics = performanceMetrics.filter(m => m.eyeTestingPhase === currentPhase);
    const nextPhaseImageIndex = currentPhaseMetrics.length;
    const totalImagesPerPhase = PlaceHolderImages.length;
    
    if (nextPhaseImageIndex >= totalImagesPerPhase) {
      moveToNextPhase();
    } else {
      const nextImageIndex = nextPhaseImageIndex % totalImagesPerPhase;
      
      updateEyeTest({
        phaseImageIndex: nextPhaseImageIndex,
        imageIndex: nextImageIndex,
      });
      updateImage({
        currentIndex: nextImageIndex,
        blurAnimation: true,
        startTime: Date.now(),
      });
      
      setTimeout(() => {
        startRecordingForImage(nextImageIndex);
      }, 200);
    }
  }, [currentPhase, performanceMetrics, resetRecordingState, updateEyeTest, updateImage, startRecordingForImage, moveToNextPhase]);

  const startEyePhase = useCallback(() => {
    updateScreen(AppScreen.MAIN);
    updateImage({
      blurAnimation: true,
      startTime: Date.now(),
    });
    
    setTimeout(() => {
      startRecordingForImage(0);
    }, 1000);
  }, [updateScreen, updateImage, startRecordingForImage]);

  return {
    moveToNextPhase,
    skipPhase,
    advanceToNextImage,
    startEyePhase,
  };
}