'use client';

import { validateAudio } from '@/ai/flows/validate-audio';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { CheckCircle, Loader2, Mic, Play, XCircle } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { EchoScribeLogo } from './icons';

type RecordingState = 'idle' | 'recording' | 'validating';
type ValidationState = 'pending' | 'success' | 'failure';

interface PerformanceMetric {
  imageIndex: number;
  imageName: string;
  startTime: number;
  responseTime?: number;
  isCorrect: boolean;
  transcribedText: string;
  blurClearTime: number; // Time when image became clear (7 seconds)
}

interface SalzburgReport {
  totalImages: number;
  correctResponses: number;
  averageResponseTime: number;
  visualAcuityScore: number;
  recognitionAccuracy: number;
  responseSpeedScore: number;
  overallScore: number;
  recommendations: string[];
  visualAcuityLevel: string;
  clinicalInterpretation: string;
  consistencyScore: number;
  standardDeviation: number;
}

const RECORDING_DURATION = 5000; // 5 seconds

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export default function EchoScribeApp() {
  const [hasStarted, setHasStarted] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [validationState, setValidationState] =
    useState<ValidationState>('pending');
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  
  // Start with the first image (index 0) instead of random
  const initialImageIndex = 0;
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [progress, setProgress] = useState(0);
  const [imageBlurAnimation, setImageBlurAnimation] = useState(false);
  
  // Performance tracking states - initialize with the first image already marked as shown
  const [shownImages, setShownImages] = useState<Set<number>>(new Set([initialImageIndex]));
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [currentImageStartTime, setCurrentImageStartTime] = useState<number>(0);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [salzburgReport, setSalzburgReport] = useState<SalzburgReport | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const currentImage = PlaceHolderImages[currentImageIndex];

  const generateSalzburgReport = () => {
    console.log(`=== GENERATING SALZBURG REPORT ===`);
    console.log(`Performance metrics count: ${performanceMetrics.length}`);
    
    if (performanceMetrics.length === 0) {
      console.log(`No performance metrics available, cannot generate report`);
      return;
    }

    const correctResponses = performanceMetrics.filter(m => m.isCorrect).length;
    const totalResponses = performanceMetrics.length;
    const avgResponseTime = performanceMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / totalResponses;
    
    // Enhanced Salzburg reading test methodology calculations
    const recognitionAccuracy = (correctResponses / totalResponses) * 100;
    
    // Salzburg reading speed scoring (based on clinical norms)
    // Normal reading recognition should be under 2-3 seconds per image
    const idealResponseTime = 2500; // 2.5 seconds
    const maxAcceptableTime = 5000; // 5 seconds
    let responseSpeedScore = 100;
    
    if (avgResponseTime > idealResponseTime) {
      const penalty = Math.min(((avgResponseTime - idealResponseTime) / (maxAcceptableTime - idealResponseTime)) * 50, 50);
      responseSpeedScore = Math.max(50, 100 - penalty);
    }
    
    // Visual processing efficiency (combination of accuracy and speed)
    const processingEfficiency = (recognitionAccuracy / 100) * (responseSpeedScore / 100) * 100;
    
    // Reading comprehension score (weighted for clinical assessment)
    const readingComprehensionScore = (recognitionAccuracy * 0.7) + (responseSpeedScore * 0.3);
    
    // Visual acuity assessment (clinical interpretation)
    let visualAcuityLevel = "Normal";
    let clinicalInterpretation = "Within normal limits for visual word recognition";
    
    if (recognitionAccuracy >= 90 && responseSpeedScore >= 80) {
      visualAcuityLevel = "Excellent";
      clinicalInterpretation = "Superior visual processing and reading recognition abilities";
    } else if (recognitionAccuracy >= 80 && responseSpeedScore >= 70) {
      visualAcuityLevel = "Good";
      clinicalInterpretation = "Good visual processing with adequate reading speed";
    } else if (recognitionAccuracy >= 70 || responseSpeedScore >= 60) {
      visualAcuityLevel = "Borderline";
      clinicalInterpretation = "Some difficulty with visual processing or reading speed";
    } else {
      visualAcuityLevel = "Below Normal";
      clinicalInterpretation = "Significant difficulties with visual word recognition";
    }
    
    // Calculate consistency (standard deviation of response times)
    const responseTimes = performanceMetrics.map(m => m.responseTime || 0);
    const stdDev = Math.sqrt(responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length);
    const consistencyScore = Math.max(0, 100 - (stdDev / 100)); // Lower std dev = higher consistency
    
    // Enhanced clinical recommendations based on Salzburg methodology
    const recommendations: string[] = [];
    
    if (recognitionAccuracy < 70) {
      recommendations.push("Recommend comprehensive eye examination and reading assessment");
      recommendations.push("Consider evaluation for visual processing disorders");
    }
    
    if (avgResponseTime > 4000) {
      recommendations.push("Slow reading recognition may indicate processing speed deficits");
      recommendations.push("Consider cognitive-perceptual evaluation");
    }
    
    if (stdDev > 1500) {
      recommendations.push("Inconsistent response times suggest attention or fatigue factors");
    }
    
    if (recognitionAccuracy >= 90 && responseSpeedScore >= 85) {
      recommendations.push("Excellent visual-verbal processing abilities");
      recommendations.push("Reading skills appear well-developed");
    }
    
    if (recognitionAccuracy < 50) {
      recommendations.push("Significant reading difficulties detected - recommend immediate professional evaluation");
    }
    
    if (recommendations.length === 0) {
      recommendations.push("Performance within normal limits for visual word recognition");
    }
    
    const report: SalzburgReport = {
      totalImages: totalResponses,
      correctResponses,
      averageResponseTime: avgResponseTime,
      visualAcuityScore: processingEfficiency,
      recognitionAccuracy,
      responseSpeedScore,
      overallScore: readingComprehensionScore,
      recommendations,
      // Add new fields for enhanced reporting
      visualAcuityLevel,
      clinicalInterpretation,
      consistencyScore,
      standardDeviation: stdDev
    };
    
    setSalzburgReport(report);
    console.log(`Salzburg report generated:`, report);
    console.log(`Report set in state, UI should now display report`);
  };

  const advanceToNextImage = () => {
    console.log(`=== ADVANCE TO NEXT IMAGE ===`);
    console.log(`Current image index before: ${currentImageIndex}`);
    console.log(`Current image before: ${PlaceHolderImages[currentImageIndex].description}`);
    
    setShownImages(currentShownImages => {
      console.log(`Shown images so far:`, Array.from(currentShownImages));
      
      // Check if all images have been shown
      if (currentShownImages.size >= PlaceHolderImages.length) {
        console.log(`All images shown, generating report`);
        console.log(`Total images: ${PlaceHolderImages.length}, Shown: ${currentShownImages.size}`);
        generateSalzburgReport();
        setIsTestComplete(true);
        console.log(`Test marked as complete`);
        return currentShownImages; // Return unchanged
      }

      // Calculate next image index first
      let nextIndex = (currentImageIndex + 1) % PlaceHolderImages.length;
      
      // If we've wrapped around and all images are shown, complete the test
      while (currentShownImages.has(nextIndex)) {
        nextIndex = (nextIndex + 1) % PlaceHolderImages.length;
        // If we've checked all images, test is complete
        if (nextIndex === currentImageIndex) {
          console.log(`No more available images, test complete`);
          generateSalzburgReport();
          setIsTestComplete(true);
          return currentShownImages; // Return unchanged
        }
      }
      
      console.log(`Next image index: ${nextIndex}, name: ${PlaceHolderImages[nextIndex].description}`);
      
      // Update other states with the new index
      setCurrentImageIndex(nextIndex);
      setValidationState('pending');
      setTranscribedText(null);
      setImageBlurAnimation(true);
      setCurrentImageStartTime(Date.now());
      
      // Reset progress bar immediately when advancing to new image
      setProgress(0);
      console.log(`Progress reset to 0 for new image: ${nextIndex}`);
      
      // Auto-start recording for the new image using the calculated index
      setTimeout(() => {
        console.log(`About to start recording after image advance for index: ${nextIndex}`);
        startRecordingForImage(nextIndex);
      }, 100); // Small delay to ensure state updates are applied
      
      // Return updated shownImages set
      return new Set([...currentShownImages, nextIndex]);
    });
  };

  const processAudio = async (audioBlob: Blob, imageIndexAtRecording: number) => {
    console.log(`=== PROCESS AUDIO CALLED ===`);
    console.log(`Image index at recording: ${imageIndexAtRecording}`);
    console.log(`Current image index now: ${currentImageIndex}`);
    console.log(`Audio blob details:`, {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    setRecordingState('validating');
    setTranscribedText(null);
    let validationSuccess = false;
    try {
      console.log(`Converting audio blob to base64...`);
      const base64Audio = await blobToBase64(audioBlob);
      console.log(`Base64 conversion complete. Length: ${base64Audio?.length || 0}`);
      
      if (!base64Audio) throw new Error('Failed to convert audio to base64');

      // Use the image index that was active when recording started
      const processingImage = PlaceHolderImages[imageIndexAtRecording];
      const goldenStandard = processingImage.description.toLowerCase().trim();
      
      console.log(`Processing image: ${processingImage.description}`);
      console.log(`Golden standard: "${goldenStandard}"`);
      console.log(`Image URL: ${processingImage.imageUrl}`);
      console.log(`About to call validateAudio API...`);
      
      const result = await validateAudio({
        audioDataUri: base64Audio,
        textToMatch: goldenStandard,
      });

      console.log(`validateAudio API response:`, result);
      console.log(`Transcribed text: "${result.transcribedText}"`);
      console.log(`Match result: ${result.matches}`);

      setTranscribedText(result.transcribedText);

      if (result.matches) {
        setValidationState('success');
        validationSuccess = true;
        toast({
          title: 'Validation Successful!',
          description: 'The spoken audio matches the text.',
          className: 'bg-green-100 dark:bg-green-900',
        });
      } else {
        setValidationState('failure');
        toast({
          variant: 'destructive',
          title: 'Validation Failed',
          description: `Expected: ${goldenStandard}, Got: ${result.transcribedText}`,
        });
      }
    } catch (error) {
      console.error('=== VALIDATION ERROR DETAILS ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Full error object:', error);
      
      setValidationState('failure');
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: `Could not validate the audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      // Record performance metric using the same image reference
      const processingImage = PlaceHolderImages[imageIndexAtRecording];
      const responseTime = Date.now() - currentImageStartTime;
      const metric: PerformanceMetric = {
        imageIndex: imageIndexAtRecording,
        imageName: processingImage.description,
        startTime: currentImageStartTime,
        responseTime,
        isCorrect: validationSuccess,
        transcribedText: transcribedText || '',
        blurClearTime: 5000 // Image becomes clear after 5 seconds
      };
      
      setPerformanceMetrics(prev => {
        const newMetrics = [...prev, metric];
        console.log(`Performance metrics updated. Total: ${newMetrics.length}/${PlaceHolderImages.length}`);
        
        // Check if this was the last image
        if (newMetrics.length >= PlaceHolderImages.length) {
          console.log(`All images completed! Generating final report...`);
          // Use setTimeout to ensure state updates are processed
          setTimeout(() => {
            generateSalzburgReport();
            setIsTestComplete(true);
            console.log(`Report generation triggered for ${newMetrics.length} images`);
          }, 500);
          
          // Set recording state and reset progress immediately for completed test
          setRecordingState('idle');
          setProgress(0);
          console.log(`Test complete - recording state set to idle, progress reset`);
          
          return newMetrics; // Return early, don't schedule advancement
        }
        
        return newMetrics;
      });
      
      // Only set recording state and schedule advancement if test is not complete
      setRecordingState('idle');
      setProgress(0);
      console.log(`Progress reset to 0 after recording completion`);
      
      // Only advance to next image if we haven't just completed all images
      // Use the current metrics count + 1 (for the one we just added) to check completion
      const currentMetricsCount = performanceMetrics.length + 1;
      if (currentMetricsCount < PlaceHolderImages.length) {
        setTimeout(() => {
          console.log(`Advancing to next image... (${currentMetricsCount}/${PlaceHolderImages.length} completed)`);
          advanceToNextImage();
        }, validationSuccess ? 1500 : 3000);
      } else {
        console.log(`Test complete, not advancing to next image (${currentMetricsCount}/${PlaceHolderImages.length} completed)`);
      }
    }
  };

  const startRecordingForImage = async (imageIndex: number) => {
    console.log(`=== START RECORDING FOR IMAGE ${imageIndex} ===`);
    console.log(`Current timer states before cleanup:`, {
      hasRecordingTimeout: !!recordingTimeoutRef.current,
      hasProgressInterval: !!progressIntervalRef.current,
      currentProgress: progress
    });

    // Clear any existing timers first - more aggressive cleanup
    if (recordingTimeoutRef.current) {
      console.log(`Clearing existing recording timeout`);
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      console.log(`Clearing existing progress interval`);
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Ensure we're starting with a completely clean state
    console.log(`Resetting all states for image ${imageIndex}`);
    
    // Reset states in the correct order to prevent UI glitches
    setProgress(0);
    setValidationState('pending');
    setTranscribedText(null);
    setRecordingState('idle'); // Explicitly set to idle first
    audioChunksRef.current = [];
    
    console.log(`All states reset, about to start recording for image ${imageIndex}`);

    // Use the passed image index explicitly
    const recordingImage = PlaceHolderImages[imageIndex];
    console.log(`=== STARTING RECORDING FOR SPECIFIC IMAGE ===`);
    console.log(`Recording for image index: ${imageIndex}`);
    console.log(`Recording for image name: ${recordingImage.description}`);
    console.log(`Recording for image URL: ${recordingImage.imageUrl}`);
    console.log(`PlaceHolderImages array:`, PlaceHolderImages.map((img, idx) => `${idx}: ${img.description}`));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      recorder.onstop = () => {
        console.log(`=== PROCESSING RECORDING ===`);
        console.log(`About to process audio for image index: ${imageIndex}`);
        console.log(`Audio chunks collected:`, audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        console.log(`Audio blob size: ${audioBlob.size} bytes`);
        console.log(`Audio blob type: ${audioBlob.type}`);
        
        if(audioBlob.size > 0) {
            console.log(`Calling processAudio with imageIndex: ${imageIndex}`);
            processAudio(audioBlob, imageIndex);
        } else {
            console.log(`Audio blob is empty, setting recording state to idle`);
            setRecordingState('idle');
        }
        stream.getTracks().forEach((track) => track.stop());
        mediaRecorderRef.current = null;
        
        // Clean up timers when recording stops - with detailed logging
        console.log(`Cleaning up timers for image ${imageIndex}:`, {
          hasRecordingTimeout: !!recordingTimeoutRef.current,
          hasProgressInterval: !!progressIntervalRef.current
        });
        
        if (recordingTimeoutRef.current) {
          console.log(`Clearing recording timeout for image ${imageIndex}`);
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        if (progressIntervalRef.current) {
          console.log(`Clearing progress interval for image ${imageIndex}`);
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        console.log(`Timer cleanup complete for image ${imageIndex}`);
      };

      recorder.start();
      
      // Small delay to ensure progress reset is processed before showing recording state
      setTimeout(() => {
        setRecordingState('recording');
        console.log(`Recording state set to 'recording' for image ${imageIndex}`);
        
        // Only create progress interval after recording state is set
        const startTime = Date.now();
        console.log(`Creating NEW progress interval for image ${imageIndex} at ${startTime}`);
        
        // Double-check no interval exists before creating new one
        if (progressIntervalRef.current) {
          console.warn(`UNEXPECTED: Progress interval still exists, clearing it`);
          clearInterval(progressIntervalRef.current);
        }
        
        progressIntervalRef.current = setInterval(() => {
          const elapsedTime = Date.now() - startTime;
          const newProgress = Math.min((elapsedTime / RECORDING_DURATION) * 100, 100);
          console.log(`Progress update for image ${imageIndex}: ${newProgress.toFixed(1)}%`);
          setProgress(newProgress);
        }, 100);
        
        console.log(`Progress interval created with ID:`, progressIntervalRef.current);
      }, 50); // Increased delay to ensure state stability

      // Automatically stop recording after 5 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        console.log(`Recording timeout reached for image ${imageIndex}`);
        console.log(`Timer states at timeout:`, {
          hasMediaRecorder: !!mediaRecorderRef.current,
          recorderState: mediaRecorderRef.current?.state,
          hasProgressInterval: !!progressIntervalRef.current
        });
        
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log(`Stopping recorder via timeout for image ${imageIndex}`);
            mediaRecorderRef.current.stop();
        }
        
        // Clean up progress interval in timeout as well
        if (progressIntervalRef.current) {
          console.log(`Clearing progress interval in timeout for image ${imageIndex}`);
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        
        setProgress(100);
        console.log(`Timeout handler complete for image ${imageIndex}`);
      }, RECORDING_DURATION);

    } catch (err) {
      console.error('Error starting recording:', err);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description:
          'Please allow microphone access in your browser settings to use this app.',
      });
       setRecordingState('idle');
    }
  };

  const startRecording = async () => {
    // Use current image index from state
    startRecordingForImage(currentImageIndex);
  };
  
    useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) clearTimeout(recordingTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Start blur animation and auto-recording when app starts
  useEffect(() => {
    if (hasStarted) {
      setImageBlurAnimation(true);
      // Record start time for the first image (already marked as shown in state initialization)
      setCurrentImageStartTime(Date.now());
      // Auto-start recording for the first image using explicit index
      setTimeout(() => {
        startRecordingForImage(initialImageIndex);
      }, 100); // Small delay to ensure state updates are applied
    }
  }, [hasStarted]);

  const getStatusText = () => {
    switch (recordingState) {
      case 'idle':
        return 'Recording will start automatically...';
      case 'recording':
        return 'Recording... speak the phrase for the image above clearly.';
      case 'validating':
        return 'Processing audio...';
      default:
        return '';
    }
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failure':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Show Salzburg test results when complete
  console.log(`Render check - isTestComplete: ${isTestComplete}, salzburgReport exists: ${!!salzburgReport}`);
  
  if (isTestComplete && salzburgReport) {
    console.log(`Rendering Salzburg report UI`);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Card className="w-full max-w-4xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <EchoScribeLogo className="h-12 w-12 text-primary" />
              <CardTitle className="text-3xl font-bold">Visual Acuity Assessment Report</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Based on Salzburg Reading Test Methodology
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Clinical Assessment Summary */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border">
              <h3 className="text-2xl font-bold mb-2">Clinical Assessment</h3>
              <div className="text-3xl font-bold text-primary mb-2">
                {salzburgReport.visualAcuityLevel}
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {salzburgReport.clinicalInterpretation}
              </p>
            </div>

            {/* Overall Score */}
            <div className="text-center p-6 bg-primary/10 rounded-lg">
              <h3 className="text-2xl font-bold mb-2">Reading Comprehension Score</h3>
              <div className="text-4xl font-bold text-primary">
                {salzburgReport.overallScore.toFixed(1)}/100
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Based on Salzburg Reading Test Methodology
              </p>
            </div>
            
            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-lg mb-2">Recognition Accuracy</h4>
                <div className="text-2xl font-bold text-green-600">
                  {salzburgReport.recognitionAccuracy.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {salzburgReport.correctResponses}/{salzburgReport.totalImages} images recognized correctly
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-lg mb-2">Response Speed</h4>
                <div className="text-2xl font-bold text-blue-600">
                  {salzburgReport.responseSpeedScore.toFixed(1)}/100
                </div>
                <p className="text-sm text-muted-foreground">
                  Avg: {(salzburgReport.averageResponseTime/1000).toFixed(1)}s per image
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-lg mb-2">Processing Efficiency</h4>
                <div className="text-2xl font-bold text-purple-600">
                  {salzburgReport.visualAcuityScore.toFixed(1)}/100
                </div>
                <p className="text-sm text-muted-foreground">
                  Combined accuracy and speed metric
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-lg mb-2">Response Consistency</h4>
                <div className="text-2xl font-bold text-indigo-600">
                  {salzburgReport.consistencyScore.toFixed(1)}/100
                </div>
                <p className="text-sm text-muted-foreground">
                  SD: {(salzburgReport.standardDeviation/1000).toFixed(2)}s
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-lg mb-2">Images Tested</h4>
                <div className="text-2xl font-bold text-orange-600">
                  {salzburgReport.totalImages}
                </div>
                <p className="text-sm text-muted-foreground">
                  Single-presentation paradigm
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-lg mb-2">Test Duration</h4>
                <div className="text-2xl font-bold text-teal-600">
                  {((salzburgReport.averageResponseTime * salzburgReport.totalImages + 5000 * salzburgReport.totalImages) / 1000 / 60).toFixed(1)}min
                </div>
                <p className="text-sm text-muted-foreground">
                  Including processing time
                </p>
              </div>
            </div>
            
            {/* Clinical Recommendations */}
            {salzburgReport.recommendations.length > 0 && (
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-semibold text-xl mb-4 text-center">Clinical Recommendations</h4>
                <div className="space-y-3">
                  {salzburgReport.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-md">
                      <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border-l-4 border-blue-400">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> This assessment is based on the Salzburg Reading Test methodology and provides preliminary screening information. 
                    For comprehensive evaluation, please consult with a qualified healthcare professional.
                  </p>
                </div>
              </div>
            )}
            
            {/* Performance Details */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-lg mb-3">Detailed Results</h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-secondary/30 rounded">
                    <span className="font-medium">{metric.imageName}</span>
                    <div className="flex gap-4">
                      <span className={metric.isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {metric.isCorrect ? '✓' : '✗'}
                      </span>
                      <span>{(metric.responseTime!/1000).toFixed(1)}s</span>
                      <span className="text-muted-foreground text-xs">
                        "{metric.transcribedText}"
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={() => window.location.reload()} size="lg">
              Take Test Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Card className="w-full max-w-md text-center p-8 shadow-2xl">
          <CardHeader>
             <div className="flex items-center justify-center gap-3">
              <EchoScribeLogo className="h-10 w-10 text-primary" />
              <CardTitle className="text-3xl font-bold">EchoValidate</CardTitle>
            </div>
            <CardDescription className="pt-2">
                Ready to test your voice? Click the button below to begin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => setHasStarted(true)} className="w-full">
              <Play className="mr-2 h-5 w-5" /> Start
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <Card className="w-full max-w-3xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <EchoScribeLogo className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl font-bold">EchoValidate</CardTitle>
            <CardDescription>
              Validate your speech against the provided image
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-secondary/30 p-4 relative">
          <div className="relative aspect-video w-full overflow-hidden rounded-md flex items-center justify-center">
            <Image
              key={currentImage.id}
              src={currentImage.imageUrl}
              alt={currentImage.description}
              width={600}
              height={400}
              data-ai-hint={currentImage.imageHint}
              className={`object-contain w-full h-full ${
                imageBlurAnimation ? 'blur-animation' : ''
              }`}
            />
          </div>
          <div className="absolute top-4 right-4">{getValidationIcon()}</div>
        </div>
        {transcribedText && (
          <div className="rounded-md border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              What you said:
            </p>
            <p className="text-lg text-center font-medium text-foreground">
              "{transcribedText}"
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center gap-4 pt-6">
        <div className="flex h-20 w-full items-center justify-center gap-4 px-8 flex-col">
            <div className="h-20 w-20 rounded-full shadow-lg flex items-center justify-center bg-primary/10 border-2 border-primary/20">
             {recordingState === 'validating' ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              ) : (
                <Mic className={cn("h-10 w-10 text-primary", recordingState === 'recording' && 'text-red-500 animate-pulse')}/>
              )}
            </div>
           {recordingState === 'recording' && <Progress value={progress} className="w-full" />}
        </div>
        <p className="text-sm text-muted-foreground h-5 text-center px-4">
          {getStatusText()}
        </p>
      </CardFooter>
    </Card>
  );
}
