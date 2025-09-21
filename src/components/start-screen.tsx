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
          <Button size="lg" onClick={onStart} className="w-full">
            <Play className="mr-2 h-5 w-5" /> Start
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}