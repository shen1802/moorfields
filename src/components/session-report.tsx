import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { EchoScribeLogo } from './icons';

interface ValidationResult {
  image: { description: string };
  matches: boolean;
  transcribedText: string;
}

interface SessionReportProps {
  sessionResults: ValidationResult[];
  onReset: () => void;
}

export function SessionReport({ sessionResults, onReset }: SessionReportProps) {
  const correctCount = sessionResults.filter(r => r.matches).length;
  const incorrectCount = sessionResults.length - correctCount;
  const accuracy = (correctCount / sessionResults.length) * 100;
  const incorrectResults = sessionResults.filter(r => !r.matches);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 md:p-8">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <EchoScribeLogo className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold">Session Report</CardTitle>
          </div>
          <CardDescription>Here's a summary of your performance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium text-muted-foreground">Correct</p>
              <p className="text-2xl font-bold text-green-500">{correctCount}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium text-muted-foreground">Incorrect</p>
              <p className="text-2xl font-bold text-red-500">{incorrectCount}</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
              <p className="text-2xl font-bold text-primary">{accuracy.toFixed(0)}%</p>
            </div>
          </div>
          {incorrectResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Review Incorrect Answers</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {incorrectResults.map((result, index) => (
                  <div key={index} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">You were asked to say:</p>
                    <p className="text-muted-foreground mb-2">"{result.image.description}"</p>
                    <p className="font-medium">You said:</p>
                    <p className="text-red-500">"{result.transcribedText}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col">
          <Button onClick={onReset} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" /> Start Over
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}