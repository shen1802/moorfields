import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Play, Eye, EyeOff } from 'lucide-react';
import { EchoScribeLogo } from './icons';
import { EyeTestingPhase } from '@/lib/constants';

interface EyeInstructionScreenProps {
  eyePhase: EyeTestingPhase;
  onStart: () => void;
  onSkipPhase: () => void;
}

export function EyeInstructionScreen({ eyePhase, onStart, onSkipPhase }: EyeInstructionScreenProps) {
  const getPhaseInfo = () => {
    switch (eyePhase) {
      case EyeTestingPhase.LEFT_EYE:
        return {
          title: 'Left Eye Testing',
          icon: '👁️',
          instruction: 'Cover or close your RIGHT eye',
          description: 'You will now test your left eye only. Please cover your right eye with your hand or close it, and look at the images with your left eye only.',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconBg: 'bg-blue-100 dark:bg-blue-900',
          textColor: 'text-blue-800 dark:text-blue-200'
        };
      case EyeTestingPhase.RIGHT_EYE:
        return {
          title: 'Right Eye Testing',
          icon: '👁️',
          instruction: 'Cover or close your LEFT eye',
          description: 'You will now test your right eye only. Please cover your left eye with your hand or close it, and look at the images with your right eye only.',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          iconBg: 'bg-green-100 dark:bg-green-900',
          textColor: 'text-green-800 dark:text-green-200'
        };
      case EyeTestingPhase.BOTH_EYES:
        return {
          title: 'Both Eyes Testing',
          icon: '👀',
          instruction: 'Use both eyes normally',
          description: 'You will now test with both eyes together. Please uncover both eyes and look at the images normally with both eyes open.',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          iconBg: 'bg-purple-100 dark:bg-purple-900',
          textColor: 'text-purple-800 dark:text-purple-200'
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <Card className={`w-full max-w-2xl text-center p-8 shadow-2xl ${phaseInfo.bgColor} border-2 ${phaseInfo.borderColor}`}>
        <CardHeader>
          <div className="flex items-center justify-center gap-3 mb-4">
            <EchoScribeLogo className="h-10 w-10 text-primary" />
            <CardTitle className="text-3xl font-bold">{phaseInfo.title}</CardTitle>
          </div>
          <CardDescription className="text-lg">
            Visual Acuity Assessment
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Phase Icon and Instruction */}
          <div className={`p-8 ${phaseInfo.iconBg} rounded-xl`}>
            <div className="text-6xl mb-4">{phaseInfo.icon}</div>
            <h3 className={`text-2xl font-bold mb-4 ${phaseInfo.textColor}`}>
              {phaseInfo.instruction}
            </h3>
            <p className={`text-lg ${phaseInfo.textColor}`}>
              {phaseInfo.description}
            </p>
          </div>

          {/* Visual Guide */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="flex items-center justify-center mb-3">
                {eyePhase === EyeTestingPhase.LEFT_EYE ? (
                  <>
                    <Eye className="h-8 w-8 text-blue-600" />
                    <EyeOff className="h-8 w-8 text-gray-400 ml-2" />
                  </>
                ) : eyePhase === EyeTestingPhase.RIGHT_EYE ? (
                  <>
                    <EyeOff className="h-8 w-8 text-gray-400" />
                    <Eye className="h-8 w-8 text-green-600 ml-2" />
                  </>
                ) : (
                  <>
                    <Eye className="h-8 w-8 text-purple-600" />
                    <Eye className="h-8 w-8 text-purple-600 ml-2" />
                  </>
                )}
              </div>
              <h4 className="font-semibold mb-2">Correct Position</h4>
              <p className="text-sm text-muted-foreground">
                {eyePhase === EyeTestingPhase.LEFT_EYE 
                  ? 'Left eye open, right eye covered'
                  : eyePhase === EyeTestingPhase.RIGHT_EYE
                  ? 'Right eye open, left eye covered'
                  : 'Both eyes open and uncovered'
                }
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold mb-2 text-yellow-800 dark:text-yellow-200">Important</h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 text-left space-y-1">
                <li>• Keep the position throughout this phase</li>
                <li>• Speak clearly when identifying images</li>
                <li>• You can skip this entire phase if needed</li>
                <li>• Skipping will recommend an eye exam</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" onClick={onStart} className="flex-1">
              <Play className="mr-2 h-5 w-5" /> 
              Start {phaseInfo.title}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={onSkipPhase}
              className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-600 dark:text-yellow-400 dark:hover:bg-yellow-950"
            >
              Skip This Phase
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}