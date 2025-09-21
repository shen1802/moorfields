import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle, Loader2, Mic, XCircle, SkipForward } from 'lucide-react';
import Image from 'next/image';
import { EchoScribeLogo } from './icons';
import { ImagePlaceholder } from '@/lib/placeholder-images';
import { RecordingState, ValidationState } from '@/lib/constants';

interface MainTestScreenProps {
  currentImage: ImagePlaceholder;
  recordingState: RecordingState;
  validationState: ValidationState;
  transcribedText: string | null;
  progress: number;
  imageBlurAnimation: boolean;
  currentEyePhase: string;
  onSkipTest: () => void;
  canSkip: boolean;
  phaseProgress: string;
}

export function MainTestScreen({
  currentImage,
  recordingState,
  validationState,
  transcribedText,
  progress,
  imageBlurAnimation,
  currentEyePhase,
  onSkipTest,
  canSkip,
  phaseProgress
}: MainTestScreenProps) {
  
  const getEyeInstructions = () => {
    switch (currentEyePhase) {
      case 'Left Eye':
        return 'Cover your right eye. Look with left eye only.';
      case 'Right Eye':
        return 'Cover your left eye. Look with right eye only.';
      case 'Both Eyes':
        return 'Use both eyes normally.';
      default:
        return '';
    }
  };

  const getStatusText = () => {
    switch (recordingState) {
      case RecordingState.IDLE:
        return 'Recording will start automatically...';
      case RecordingState.RECORDING:
        return 'Recording... speak the phrase for the image above clearly.';
      case RecordingState.VALIDATING:
        return 'Processing audio...';
      default:
        return '';
    }
  };

  const getValidationIcon = () => {
    switch (validationState) {
      case ValidationState.SUCCESS:
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case ValidationState.FAILURE:
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EchoScribeLogo className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl font-bold">EchoValidate</CardTitle>
              <CardDescription>
                Validate your speech against the provided image
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-primary">{currentEyePhase} Test</div>
            <div className="text-sm text-muted-foreground">Image {phaseProgress}</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border-l-4 border-blue-500">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {getEyeInstructions()}
          </p>
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
            {recordingState === RecordingState.VALIDATING ? (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            ) : (
              <Mic className={cn("h-10 w-10 text-primary", recordingState === RecordingState.RECORDING && 'text-red-500 animate-pulse')}/>
            )}
          </div>
          {(recordingState === RecordingState.RECORDING || progress > 0) && (
            <div className="w-full">
              <Progress value={progress} className="w-full h-2" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 w-full">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground h-5 text-center px-4">
              {getStatusText()}
            </p>
          </div>
          {canSkip && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSkipTest}
              className="flex items-center gap-2 text-yellow-600 border-yellow-300 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-600 dark:hover:bg-yellow-950"
            >
              <SkipForward className="h-4 w-4" />
              Skip Phase
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}