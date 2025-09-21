import { useRef, useCallback } from 'react';
import { RECORDING_DURATION, PROGRESS_UPDATE_INTERVAL } from '@/lib/constants';
import { blobToBase64 } from '@/lib/audio-utils';

export function useAudioRecording() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRecordingRef = useRef<boolean>(false);
  const sessionIdRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    isActiveRecordingRef.current = false;
    sessionIdRef.current = sessionIdRef.current + 1; // Increment session to invalidate old callbacks
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async (
    onProgressUpdate: (progress: number) => void,
    onRecordingComplete: (audioBlob: Blob) => void,
    onError: (error: Error) => void
  ) => {
    // Check if MediaRecorder is supported
    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      console.error('MediaRecorder not supported');
      onError(new Error('MediaRecorder not supported in this browser'));
      return;
    }
    
    // Clean up any existing recording
    cleanup();
    isActiveRecordingRef.current = true;
    
    // Capture the current session ID to prevent cross-session updates
    const currentSessionId = sessionIdRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      recorder.onstop = () => {
        // Only process if this is still the active session
        if (currentSessionId === sessionIdRef.current && isActiveRecordingRef.current) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          if (audioBlob.size > 0) {
            onRecordingComplete(audioBlob);
          } else {
            console.warn('Empty audio blob received');
          }
        }
        
        stream.getTracks().forEach((track) => track.stop());
        cleanup();
      };

      recorder.start();

      // Set up progress tracking with session validation
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        // Only update progress if this session is still active
        if (!isActiveRecordingRef.current || currentSessionId !== sessionIdRef.current) {
          return;
        }
        
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min((elapsedTime / RECORDING_DURATION) * 100, 100);
        onProgressUpdate(progress);
      }, PROGRESS_UPDATE_INTERVAL);

      // Auto-stop recording after duration
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && 
            mediaRecorderRef.current.state === 'recording' && 
            isActiveRecordingRef.current &&
            currentSessionId === sessionIdRef.current) {
          mediaRecorderRef.current.stop();
        }
        if (isActiveRecordingRef.current && currentSessionId === sessionIdRef.current) {
          onProgressUpdate(100);
        }
      }, RECORDING_DURATION);

    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to start recording'));
      cleanup();
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return {
    startRecording,
    stopRecording,
    cleanup,
    blobToBase64
  };
}