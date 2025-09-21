import { IDEAL_RESPONSE_TIME, MAX_ACCEPTABLE_TIME, VisualAcuityLevel } from './constants';

export interface PerformanceMetric {
  imageIndex: number;
  imageName: string;
  startTime: number;
  responseTime?: number;
  isCorrect: boolean;
  transcribedText: string;
  blurClearTime: number; // Time when image became clear (7 seconds)
  eyeTestingPhase: string; // Which eye(s) were being tested
  wasSkipped: boolean; // Whether this test was skipped
}

export interface SalzburgReport {
  totalImages: number;
  correctResponses: number;
  completedTests: number; // Actual number of completed tests (not skipped)
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
  shouldVisitOphthalmologist: boolean; // Flag for skipped tests
  skippedTests: number; // Number of skipped tests
  leftEyeResults?: { correctResponses: number; totalTests: number; skipped: number };
  rightEyeResults?: { correctResponses: number; totalTests: number; skipped: number };
  bothEyesResults?: { correctResponses: number; totalTests: number; skipped: number };
}

export function generateSalzburgReport(performanceMetrics: PerformanceMetric[]): SalzburgReport | null {
  if (performanceMetrics.length === 0) {
    return null;
  }

  const correctResponses = performanceMetrics.filter(m => m.isCorrect && !m.wasSkipped).length;
  const actualSkippedTests = performanceMetrics.filter(m => m.wasSkipped).length;
  const completedTests = performanceMetrics.filter(m => !m.wasSkipped).length; // Actual completed tests
  
  // Calculate expected total tests: should always be total images × 3 phases
  // regardless of how many phases were actually attempted/completed
  const uniqueImages = new Set(performanceMetrics.map(m => m.imageName));
  let imagesPerPhase = uniqueImages.size;
  
  // Fallback: if no metrics exist or very few, assume standard 13 images per phase
  if (imagesPerPhase === 0 || (performanceMetrics.length > 0 && imagesPerPhase < 13)) {
    imagesPerPhase = 13; // Standard number of images in PlaceHolderImages
  }
  
  const expectedTotalTests = imagesPerPhase * 3; // Always 3 phases: left-eye, right-eye, both-eyes
  const actualTotalTests = performanceMetrics.length;
  
  // Calculate the expected skipped tests: if total recorded tests < expected, the difference is skipped
  const skippedTests = Math.max(actualSkippedTests, expectedTotalTests - completedTests);
  
  // Count phases that have any metrics (attempted or skipped)
  const phasesAttempted = new Set(performanceMetrics.map(m => m.eyeTestingPhase));
  
  console.log('📊 Salzburg Report - Test counts:', {
    expectedTotalTests,
    actualTotalTests,
    completedTests,
    actualSkippedTests,
    calculatedSkippedTests: skippedTests,
    correctResponses,
    imagesPerPhase,
    phasesAttempted: Array.from(phasesAttempted),
    uniqueImages: Array.from(uniqueImages)
  });
  
  const avgResponseTime = performanceMetrics
    .filter(m => !m.wasSkipped)
    .reduce((sum, m) => sum + (m.responseTime || 0), 0) / Math.max(1, actualTotalTests - skippedTests);
  
  // Calculate per-eye results
  const leftEyeMetrics = performanceMetrics.filter(m => m.eyeTestingPhase === 'left-eye');
  const rightEyeMetrics = performanceMetrics.filter(m => m.eyeTestingPhase === 'right-eye');
  const bothEyesMetrics = performanceMetrics.filter(m => m.eyeTestingPhase === 'both-eyes');

  // Debug: Show breakdown by eye phase
  console.log('📊 Salzburg Report - By phase breakdown:', {
    leftEyeTotal: leftEyeMetrics.length,
    leftEyeSkipped: leftEyeMetrics.filter(m => m.wasSkipped).length,
    leftEyeCompleted: leftEyeMetrics.filter(m => !m.wasSkipped).length,
    rightEyeTotal: rightEyeMetrics.length,
    rightEyeSkipped: rightEyeMetrics.filter(m => m.wasSkipped).length,
    rightEyeCompleted: rightEyeMetrics.filter(m => !m.wasSkipped).length,
    bothEyesTotal: bothEyesMetrics.length,
    bothEyesSkipped: bothEyesMetrics.filter(m => m.wasSkipped).length,
    bothEyesCompleted: bothEyesMetrics.filter(m => !m.wasSkipped).length
  });

  console.log('📊 Salzburg Report - Eye metrics:', {
    totalMetrics: performanceMetrics.length,
    leftEyeCount: leftEyeMetrics.length,
    rightEyeCount: rightEyeMetrics.length,
    bothEyesCount: bothEyesMetrics.length,
    allPhases: performanceMetrics.map(m => m.eyeTestingPhase)
  });

  // Calculate per-eye results with proper handling for skipped phases
  const calculateEyeResults = (metrics: PerformanceMetric[]) => {
    const completed = metrics.filter(m => !m.wasSkipped).length;
    const skippedInMetrics = metrics.filter(m => m.wasSkipped).length;
    const correctInMetrics = metrics.filter(m => m.isCorrect && !m.wasSkipped).length;
    
    // If no metrics exist for this phase, assume it was skipped entirely
    if (metrics.length === 0) {
      return {
        correctResponses: 0,
        totalTests: imagesPerPhase,
        skipped: imagesPerPhase // All tests in this phase were skipped
      };
    }
    
    return {
      correctResponses: correctInMetrics,
      totalTests: imagesPerPhase, // Always show expected total (13)
      skipped: skippedInMetrics
    };
  };

  const leftEyeResults = calculateEyeResults(leftEyeMetrics);
  const rightEyeResults = calculateEyeResults(rightEyeMetrics);
  const bothEyesResults = calculateEyeResults(bothEyesMetrics);
  
  // Enhanced Salzburg reading test methodology calculations
  const recognitionAccuracy = completedTests > 0 ? (correctResponses / completedTests) * 100 : 0;
  
  // Salzburg reading speed scoring (based on clinical norms)
  let responseSpeedScore = 100;
  
  if (avgResponseTime > IDEAL_RESPONSE_TIME) {
    const penalty = Math.min(((avgResponseTime - IDEAL_RESPONSE_TIME) / (MAX_ACCEPTABLE_TIME - IDEAL_RESPONSE_TIME)) * 50, 50);
    responseSpeedScore = Math.max(50, 100 - penalty);
  }
  
  // Visual processing efficiency (combination of accuracy and speed)
  const processingEfficiency = (recognitionAccuracy / 100) * (responseSpeedScore / 100) * 100;
  
  // Reading comprehension score (weighted for clinical assessment)
  const readingComprehensionScore = (recognitionAccuracy * 0.7) + (responseSpeedScore * 0.3);
  
  // Visual acuity assessment (clinical interpretation)
  const { visualAcuityLevel, clinicalInterpretation } = getVisualAcuityAssessment(recognitionAccuracy, responseSpeedScore);
  
  // Calculate consistency (standard deviation of response times)
  const responseTimes = performanceMetrics.filter(m => !m.wasSkipped).map(m => m.responseTime || 0);
  const stdDev = responseTimes.length > 0 ? 
    Math.sqrt(responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length) : 0;
  const consistencyScore = Math.max(0, 100 - (stdDev / 100)); // Lower std dev = higher consistency
  
  // Enhanced clinical recommendations based on Salzburg methodology
  const recommendations = generateRecommendations(recognitionAccuracy, avgResponseTime, stdDev, skippedTests > 0);
  
  const report: SalzburgReport = {
    totalImages: expectedTotalTests, // Use expected total, not actual recorded tests
    correctResponses,
    completedTests, // Actual completed tests
    averageResponseTime: avgResponseTime,
    visualAcuityScore: processingEfficiency,
    recognitionAccuracy,
    responseSpeedScore,
    overallScore: readingComprehensionScore,
    recommendations,
    visualAcuityLevel,
    clinicalInterpretation,
    consistencyScore,
    standardDeviation: stdDev,
    shouldVisitOphthalmologist: skippedTests > 0,
    skippedTests,
    leftEyeResults,
    rightEyeResults,
    bothEyesResults
  };
  
  return report;
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

function generateRecommendations(recognitionAccuracy: number, avgResponseTime: number, stdDev: number, hasSkippedTests: boolean = false): string[] {
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