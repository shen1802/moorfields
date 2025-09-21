import { IDEAL_RESPONSE_TIME, MAX_ACCEPTABLE_TIME, VisualAcuityLevel, STANDARD_IMAGES_PER_PHASE, TOTAL_EYE_PHASES } from './constants';
import { PlaceHolderImages } from './placeholder-images';

export interface PerformanceMetric {
  imageIndex: number;
  imageName: string;
  startTime: number;
  responseTime?: number;
  isCorrect: boolean;
  transcribedText: string;
  blurClearTime: number;
  eyeTestingPhase: string;
  wasSkipped: boolean;
}

export interface EyeResults {
  correctResponses: number;
  totalTests: number;
  skipped: number;
}

export interface SalzburgReport {
  totalImages: number;
  correctResponses: number;
  completedTests: number;
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
  shouldVisitOphthalmologist: boolean;
  skippedTests: number;
  leftEyeResults?: EyeResults;
  rightEyeResults?: EyeResults;
  bothEyesResults?: EyeResults;
}

// Use actual number of images available
const ACTUAL_IMAGES_COUNT = PlaceHolderImages.length;

export function generateSalzburgReport(performanceMetrics: PerformanceMetric[]): SalzburgReport | null {
  if (performanceMetrics.length === 0) {
    return null;
  }

  // Ensure we account for all possible tests across all phases
  const completeMetrics = ensureAllPhasesAccountedFor(performanceMetrics);
  
  const { completedMetrics, skippedMetrics } = categorizeMetrics(completeMetrics);
  const { leftEye, rightEye, bothEyes } = groupMetricsByPhase(completeMetrics);
  
  const expectedTotalTests = ACTUAL_IMAGES_COUNT * TOTAL_EYE_PHASES;
  const correctResponses = completedMetrics.filter(m => m.isCorrect).length;
  const averageResponseTime = calculateAverageResponseTime(completedMetrics);
  
  const recognitionAccuracy = completedMetrics.length > 0 ? (correctResponses / completedMetrics.length) * 100 : 0;
  const responseSpeedScore = calculateResponseSpeedScore(averageResponseTime);
  const processingEfficiency = (recognitionAccuracy / 100) * (responseSpeedScore / 100) * 100;
  const readingComprehensionScore = (recognitionAccuracy * 0.7) + (responseSpeedScore * 0.3);
  
  const { visualAcuityLevel, clinicalInterpretation } = getVisualAcuityAssessment(recognitionAccuracy, responseSpeedScore);
  const { consistencyScore, standardDeviation } = calculateConsistencyMetrics(completedMetrics, averageResponseTime);
  
  const shouldVisitOphthalmologist = skippedMetrics.length > 0;
  const recommendations = generateRecommendations(recognitionAccuracy, averageResponseTime, standardDeviation, shouldVisitOphthalmologist);

  return {
    totalImages: expectedTotalTests,
    correctResponses,
    completedTests: completedMetrics.length,
    averageResponseTime,
    visualAcuityScore: processingEfficiency,
    recognitionAccuracy,
    responseSpeedScore,
    overallScore: readingComprehensionScore,
    recommendations,
    visualAcuityLevel,
    clinicalInterpretation,
    consistencyScore,
    standardDeviation,
    shouldVisitOphthalmologist,
    skippedTests: skippedMetrics.length,
    leftEyeResults: calculateEyeResults(leftEye),
    rightEyeResults: calculateEyeResults(rightEye),
    bothEyesResults: calculateEyeResults(bothEyes),
  };
}

function categorizeMetrics(metrics: PerformanceMetric[]) {
  const completedMetrics = metrics.filter(m => !m.wasSkipped);
  const skippedMetrics = metrics.filter(m => m.wasSkipped);
  return { completedMetrics, skippedMetrics };
}

function ensureAllPhasesAccountedFor(metrics: PerformanceMetric[]): PerformanceMetric[] {
  const phases = ['left-eye', 'right-eye', 'both-eyes'];
  const result = [...metrics];
  
  // For each phase, ensure we have exactly ACTUAL_IMAGES_COUNT metrics
  phases.forEach(phase => {
    const phaseMetrics = result.filter(m => m.eyeTestingPhase === phase);
    const missingCount = ACTUAL_IMAGES_COUNT - phaseMetrics.length;
    
    if (missingCount > 0) {
      // Add skipped metrics for missing tests in this phase
      for (let i = phaseMetrics.length; i < ACTUAL_IMAGES_COUNT; i++) {
        const skippedMetric: PerformanceMetric = {
          imageIndex: i,
          imageName: PlaceHolderImages[i].description,
          startTime: Date.now(),
          responseTime: 0,
          isCorrect: false,
          transcribedText: 'Phase not completed',
          blurClearTime: 5000,
          eyeTestingPhase: phase,
          wasSkipped: true
        };
        result.push(skippedMetric);
      }
    }
  });
  
  return result;
}

function groupMetricsByPhase(metrics: PerformanceMetric[]) {
  return {
    leftEye: metrics.filter(m => m.eyeTestingPhase === 'left-eye'),
    rightEye: metrics.filter(m => m.eyeTestingPhase === 'right-eye'),
    bothEyes: metrics.filter(m => m.eyeTestingPhase === 'both-eyes'),
  };
}

function calculateAverageResponseTime(completedMetrics: PerformanceMetric[]): number {
  if (completedMetrics.length === 0) return 0;
  const totalTime = completedMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0);
  return totalTime / completedMetrics.length;
}

function calculateResponseSpeedScore(avgResponseTime: number): number {
  if (avgResponseTime <= IDEAL_RESPONSE_TIME) return 100;
  
  const penalty = Math.min(((avgResponseTime - IDEAL_RESPONSE_TIME) / (MAX_ACCEPTABLE_TIME - IDEAL_RESPONSE_TIME)) * 50, 50);
  return Math.max(50, 100 - penalty);
}

function calculateEyeResults(phaseMetrics: PerformanceMetric[]): EyeResults {
  const completed = phaseMetrics.filter(m => !m.wasSkipped);
  const skipped = phaseMetrics.filter(m => m.wasSkipped);
  const correct = completed.filter(m => m.isCorrect);
  
  return {
    correctResponses: correct.length,
    totalTests: ACTUAL_IMAGES_COUNT,
    skipped: skipped.length + Math.max(0, ACTUAL_IMAGES_COUNT - phaseMetrics.length),
  };
}

function calculateConsistencyMetrics(completedMetrics: PerformanceMetric[], avgResponseTime: number) {
  if (completedMetrics.length === 0) {
    return { consistencyScore: 0, standardDeviation: 0 };
  }
  
  const responseTimes = completedMetrics.map(m => m.responseTime || 0);
  const variance = responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length;
  const standardDeviation = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 100 - (standardDeviation / 100));
  
  return { consistencyScore, standardDeviation };
}

function getVisualAcuityAssessment(recognitionAccuracy: number, responseSpeedScore: number) {
  let visualAcuityLevel = VisualAcuityLevel.NORMAL;
  let clinicalInterpretation = "Within normal limits for visual word recognition";
  
  if (recognitionAccuracy >= 90 && responseSpeedScore >= 80) {
    visualAcuityLevel = VisualAcuityLevel.EXCELLENT;
    clinicalInterpretation = "Superior visual processing and reading recognition abilities";
  } else if (recognitionAccuracy >= 80 && responseSpeedScore >= 70) {
    visualAcuityLevel = VisualAcuityLevel.GOOD;
    clinicalInterpretation = "Good visual processing with adequate reading speed";
  } else if (recognitionAccuracy >= 70 || responseSpeedScore >= 60) {
    visualAcuityLevel = VisualAcuityLevel.BORDERLINE;
    clinicalInterpretation = "Some difficulty with visual processing or reading speed";
  } else {
    visualAcuityLevel = VisualAcuityLevel.BELOW_NORMAL;
    clinicalInterpretation = "Significant difficulties with visual word recognition";
  }
  
  return { visualAcuityLevel, clinicalInterpretation };
}

function generateRecommendations(recognitionAccuracy: number, avgResponseTime: number, stdDev: number, hasSkippedTests: boolean): string[] {
  const recommendations: string[] = [];
  
  if (hasSkippedTests) {
    recommendations.push("⚠️ IMPORTANT: Tests were skipped - Recommend immediate ophthalmologist consultation");
    recommendations.push("Skipped tests may indicate visual discomfort or difficulty");
  }
  
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
  
  if (recognitionAccuracy >= 90 && avgResponseTime <= IDEAL_RESPONSE_TIME && !hasSkippedTests) {
    recommendations.push("Excellent visual-verbal processing abilities");
    recommendations.push("Reading skills appear well-developed");
  }
  
  if (recognitionAccuracy < 50) {
    recommendations.push("Significant reading difficulties detected - recommend immediate professional evaluation");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("Performance within normal limits for visual word recognition");
  }
  
  return recommendations;
}