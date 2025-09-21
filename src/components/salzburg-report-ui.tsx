import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { EchoScribeLogo } from './icons';
import { SalzburgReport, PerformanceMetric } from '@/lib/salzburg-report';

interface SalzburgReportUIProps {
  report: SalzburgReport;
  performanceMetrics: PerformanceMetric[];
  onRestart: () => void;
}

export function SalzburgReportUI({ report, performanceMetrics, onRestart }: SalzburgReportUIProps) {
  // Calculate actual test duration based on performance metrics
  const calculateTestDuration = () => {
    if (performanceMetrics.length === 0) {
      // Fallback: estimate based on report data
      return ((report.averageResponseTime * report.completedTests + 3000 * report.totalImages) / 1000 / 60);
    }
    
    // Find the earliest start time and latest end time
    const startTimes = performanceMetrics.map(m => m.startTime);
    const endTimes = performanceMetrics.map(m => {
      if (m.wasSkipped) {
        // For skipped tests, assume minimal time (just the start time)
        return m.startTime + 1000; // 1 second for skip action
      }
      // For completed tests, add response time and processing time
      return m.startTime + (m.responseTime || 0) + 2000; // 2 seconds processing buffer
    });
    
    const testStartTime = Math.min(...startTimes);
    const testEndTime = Math.max(...endTimes);
    
    return (testEndTime - testStartTime) / 1000 / 60; // Convert to minutes
  };

  const actualTestDuration = calculateTestDuration();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-4xl shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <EchoScribeLogo className="h-12 w-12 text-primary" />
            <CardTitle className="text-3xl font-bold">PANDA Animal Recognition Report</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Based on Animal Recognition Test Methodology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ophthalmologist Alert */}
          {report.shouldVisitOphthalmologist && (
            <div className="p-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-3">
                  ⚠️ Important Medical Recommendation
                </h3>
                <div className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                  Please consult an ophthalmologist
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  {report.skippedTests} out of {report.totalImages} total tests were skipped across all testing phases, which may indicate visual discomfort or difficulty. 
                  A professional eye examination is recommended.
                </p>
                <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-md">
                  <p className="text-xs text-red-800 dark:text-red-200">
                    This recommendation is generated automatically when tests are skipped and should not replace professional medical advice.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Clinical Assessment Summary */}
          <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border">
            <h3 className="text-2xl font-bold mb-2">Clinical Assessment</h3>
            <div className="text-3xl font-bold text-primary mb-2">
              {report.visualAcuityLevel}
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {report.clinicalInterpretation}
            </p>
          </div>

          {/* Per-Eye Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EyeResultCard
              title="Left Eye"
              results={report.leftEyeResults}
              icon="👁️"
            />
            <EyeResultCard
              title="Right Eye"
              results={report.rightEyeResults}
              icon="👁️"
            />
            <EyeResultCard
              title="Both Eyes"
              results={report.bothEyesResults}
              icon="👀"
            />
          </div>

          {/* Overall Score */}
          <div className="text-center p-6 bg-primary/10 rounded-lg">
            <h3 className="text-2xl font-bold mb-2">Animal Recognition Score</h3>
            <div className="text-4xl font-bold text-primary">
              {report.overallScore.toFixed(1)}/100
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on Animal Recognition Test Methodology
            </p>
          </div>
          
          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Recognition Accuracy"
              value={`${report.recognitionAccuracy.toFixed(1)}%`}
              subtitle={`${report.correctResponses}/${report.completedTests} completed tests correct`}
              colorClass="text-green-600"
            />
            
            <MetricCard
              title="Response Speed"
              value={`${report.responseSpeedScore.toFixed(1)}/100`}
              subtitle={`Avg: ${(report.averageResponseTime/1000).toFixed(1)}s per image`}
              colorClass="text-blue-600"
            />
            
            <MetricCard
              title="Processing Efficiency"
              value={`${report.visualAcuityScore.toFixed(1)}/100`}
              subtitle="Combined accuracy and speed metric"
              colorClass="text-purple-600"
            />
            
            <MetricCard
              title="Response Consistency"
              value={`${report.consistencyScore.toFixed(1)}/100`}
              subtitle={`SD: ${(report.standardDeviation/1000).toFixed(2)}s`}
              colorClass="text-indigo-600"
            />
            
            <MetricCard
              title="Total Tests"
              value={`${report.totalImages}`}
              subtitle={`${report.completedTests} completed, ${report.skippedTests} skipped`}
              colorClass="text-orange-600"
            />

            <MetricCard
              title="Test Duration"
              value={`${actualTestDuration.toFixed(1)}min`}
              subtitle={`${performanceMetrics.length > 0 ? 'Actual' : 'Estimated'} time including all phases`}
              colorClass="text-teal-600"
            />
          </div>
          
          {/* Clinical Recommendations */}
          {report.recommendations.length > 0 && (
            <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h4 className="font-semibold text-xl mb-4 text-center">Clinical Recommendations</h4>
              <div className="space-y-3">
                {report.recommendations.map((rec, index) => (
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
                  <strong>Note:</strong> This assessment is based on the PANDA Animal Recognition Test methodology and provides preliminary screening information. 
                  For comprehensive evaluation, please consult with a qualified healthcare professional.
                </p>
              </div>
            </div>
          )}
          
          {/* Performance Details */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-lg mb-3">Detailed Results</h4>
            <div className="max-h-60 overflow-y-auto space-y-3">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="p-3 bg-secondary/30 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-base">{metric.imageName}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        metric.eyeTestingPhase === 'left-eye' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        metric.eyeTestingPhase === 'right-eye' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      }`}>
                        {metric.eyeTestingPhase === 'left-eye' ? 'Left Eye' :
                         metric.eyeTestingPhase === 'right-eye' ? 'Right Eye' : 'Both Eyes'}
                      </span>
                      <span className={`text-lg ${
                        metric.wasSkipped ? 'text-yellow-600' :
                        metric.isCorrect ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.wasSkipped ? '⏭️' : metric.isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    <span className="text-sm font-mono bg-background px-2 py-1 rounded">
                      {metric.wasSkipped ? 'Skipped' : `${(metric.responseTime!/1000).toFixed(1)}s`}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px]">Expected:</span>
                      <span className="font-medium text-blue-700 dark:text-blue-300">"{metric.imageName}"</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px]">You said:</span>
                      <span className={`font-medium ${
                        metric.wasSkipped ? 'text-yellow-700 dark:text-yellow-300' :
                        metric.isCorrect 
                          ? 'text-green-700 dark:text-green-300' 
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        "{metric.transcribedText}"
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={onRestart} size="lg">
            Take Test Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  colorClass: string;
}

function MetricCard({ title, value, subtitle, colorClass }: MetricCardProps) {
  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-semibold text-lg mb-2">{title}</h4>
      <div className={`text-2xl font-bold ${colorClass}`}>
        {value}
      </div>
      <p className="text-sm text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

interface EyeResultCardProps {
  title: string;
  results?: { correctResponses: number; totalTests: number; skipped: number };
  icon: string;
}

function EyeResultCard({ title, results, icon }: EyeResultCardProps) {
  if (!results) return null;
  
  const completedTests = results.totalTests - results.skipped;
  const accuracy = completedTests > 0 ? 
    ((results.correctResponses / completedTests) * 100) : 0;
  
  // Check if all tests were skipped
  const allSkipped = results.skipped === results.totalTests;
  
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h4 className="font-semibold text-lg">{title}</h4>
      </div>
      <div className="space-y-2">
        <div className="text-xl font-bold text-primary">
          {allSkipped ? 'All Skipped' : 
           isNaN(accuracy) ? 'N/A' : `${accuracy.toFixed(1)}%`}
        </div>
        <div className="text-sm text-muted-foreground">
          {allSkipped ? 
            `0/${results.totalTests} completed` :
            `${results.correctResponses}/${completedTests} correct`
          }
        </div>
        {results.skipped > 0 && (
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            {results.skipped} of {results.totalTests} skipped
          </div>
        )}
      </div>
    </div>
  );
}