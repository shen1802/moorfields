import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Play } from 'lucide-react';
import { EchoScribeLogo } from './icons';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <Card className="w-full max-w-2xl text-center p-8 shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-center gap-3">
            <EchoScribeLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">EchoValidate</CardTitle>
          </div>
          <CardDescription className="pt-2 text-lg">
            Visual Acuity Assessment - Three-Phase Eye Testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-left space-y-4">
            <h3 className="text-xl font-semibold text-center mb-4">Testing Phases</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                <div className="text-2xl mb-2">👁️</div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">Phase 1: Left Eye</h4>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Cover your right eye, test with left eye only
                </p>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                <div className="text-2xl mb-2">👁️</div>
                <h4 className="font-semibold text-green-700 dark:text-green-300">Phase 2: Right Eye</h4>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Cover your left eye, test with right eye only
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border">
                <div className="text-2xl mb-2">👀</div>
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">Phase 3: Both Eyes</h4>
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  Use both eyes together normally
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Testing Flow:</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Clear instructions will be shown before each eye test</li>
                <li>• Each phase tests the same images for comparison</li>
                <li>• You can skip entire phases if experiencing difficulty</li>
                <li>• Skipping phases will recommend an ophthalmologist visit</li>
                <li>• Speak clearly when identifying the images shown</li>
              </ul>
            </div>
          </div>
          
          <Button size="lg" onClick={onStart} className="w-full">
            <Play className="mr-2 h-5 w-5" /> Start Visual Assessment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}