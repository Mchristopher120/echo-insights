import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
}

export const AudioRecorder = ({ onRecordingComplete }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob, recordingTime);
        stream.getTracks().forEach((track) => track.stop());
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('Gravação iniciada');
    } catch (error) {
      toast.error('Erro ao acessar microfone');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      toast.success('Gravação finalizada');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {isRecording && (
        <div className="text-2xl font-mono font-semibold text-primary animate-pulse">
          {formatTime(recordingTime)}
        </div>
      )}
      
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        size="lg"
        className={`rounded-full w-20 h-20 transition-all duration-300 ${
          isRecording
            ? 'bg-destructive hover:bg-destructive/90 scale-110'
            : 'bg-gradient-primary hover:opacity-90'
        }`}
      >
        {isRecording ? (
          <Square className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </Button>
      
      <p className="text-sm text-muted-foreground">
        {isRecording ? 'Clique para parar' : 'Clique para gravar'}
      </p>
    </div>
  );
};
