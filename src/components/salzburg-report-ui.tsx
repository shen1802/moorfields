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
              {report.visualAcuityLevel}
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {report.clinicalInterpretation}
            </p>
          </div>

          {/* Overall Score */}
          <div className="text-center p-6 bg-primary/10 rounded-lg">
            <h3 className="text-2xl font-bold mb-2">Reading Comprehension Score</h3>
            <div className="text-4xl font-bold text-primary">
              {report.overallScore.toFixed(1)}/100
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Based on Salzburg Reading Test Methodology
            </p>
          </div>
          
          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Recognition Accuracy"
              value={`${report.recognitionAccuracy.toFixed(1)}%`}
              subtitle={`${report.correctResponses}/${report.totalImages} images recognized correctly`}
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
              title="Images Tested"
              value={`${report.totalImages}`}
              subtitle="Single-presentation paradigm"
              colorClass="text-orange-600"
            />

            <MetricCard
              title="Test Duration"
              value={`${((report.averageResponseTime * report.totalImages + 5000 * report.totalImages) / 1000 / 60).toFixed(1)}min`}
              subtitle="Including processing time"
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
                  <strong>Note:</strong> This assessment is based on the Salzburg Reading Test methodology and provides preliminary screening information. 
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
                      <span className={`text-lg ${metric.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.isCorrect ? '✓' : '✗'}
                      </span>
                    </div>
                    <span className="text-sm font-mono bg-background px-2 py-1 rounded">
                      {(metric.responseTime!/1000).toFixed(1)}s
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