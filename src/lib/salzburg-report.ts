import { IDEAL_RESPONSE_TIME, MAX_ACCEPTABLE_TIME, VisualAcuityLevel } from './constants';

export interface PerformanceMetric {
  imageIndex: number;
  imageName: string;
  startTime: number;
  responseTime?: number;
  isCorrect: boolean;
  transcribedText: string;
  blurClearTime: number; // Time when image became clear (7 seconds)
}

export interface SalzburgReport {
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

export function generateSalzburgReport(performanceMetrics: PerformanceMetric[]): SalzburgReport | null {
  if (performanceMetrics.length === 0) {
    return null;
  }

  const correctResponses = performanceMetrics.filter(m => m.isCorrect).length;
  const totalResponses = performanceMetrics.length;
  const avgResponseTime = performanceMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / totalResponses;
  
  // Enhanced Salzburg reading test methodology calculations
  const recognitionAccuracy = (correctResponses / totalResponses) * 100;
  
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
  const responseTimes = performanceMetrics.map(m => m.responseTime || 0);
  const stdDev = Math.sqrt(responseTimes.reduce((sum, time) => sum + Math.pow(time - avgResponseTime, 2), 0) / responseTimes.length);
  const consistencyScore = Math.max(0, 100 - (stdDev / 100)); // Lower std dev = higher consistency
  
  // Enhanced clinical recommendations based on Salzburg methodology
  const recommendations = generateRecommendations(recognitionAccuracy, avgResponseTime, stdDev);
  
  const report: SalzburgReport = {
    totalImages: totalResponses,
    correctResponses,
    averageResponseTime: avgResponseTime,
    visualAcuityScore: processingEfficiency,
    recognitionAccuracy,
    responseSpeedScore,
    overallScore: readingComprehensionScore,
    recommendations,
    visualAcuityLevel,
    clinicalInterpretation,
    consistencyScore,
    standardDeviation: stdDev
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

function generateRecommendations(recognitionAccuracy: number, avgResponseTime: number, stdDev: number): string[] {
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
  
  if (recognitionAccuracy >= 90 && avgResponseTime <= IDEAL_RESPONSE_TIME) {
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