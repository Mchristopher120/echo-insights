import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  audioUrl: string;
  duration: number;
}

export const AudioPlayer = ({ audioUrl, duration }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-full">
      <audio ref={audioRef} src={audioUrl} />
      
      <Button
        onClick={togglePlay}
        size="sm"
        variant="ghost"
        className="rounded-full w-10 h-10 flex-shrink-0"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-muted-foreground min-w-[35px]">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleSliderChange}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground min-w-[35px]">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
};
