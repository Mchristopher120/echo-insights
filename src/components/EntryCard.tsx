import { AudioPlayer } from './AudioPlayer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Calendar, Clock, Volume2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Entry {
  id: string;
  audio_url: string;
  duration: number;
  date: Date;
  insights?: string | null;
  insights_audio_url?: string | null;
}

interface EntryCardProps {
  entry: Entry;
  onGenerateInsights: (entryId: string) => void;
  isGenerating?: boolean;
}

export const EntryCard = ({ entry, onGenerateInsights, isGenerating }: EntryCardProps) => {
  return (
    <Card className="p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(entry.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{format(entry.date, 'HH:mm')}</span>
            </div>
          </div>
          
          {!entry.insights && (
            <Button
              onClick={() => onGenerateInsights(entry.id)}
              disabled={isGenerating}
              size="sm"
              className="bg-gradient-secondary hover:opacity-90"
            >
              {isGenerating ? (
                <>Gerando...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Insights
                </>
              )}
            </Button>
          )}
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Seu áudio:</p>
          <AudioPlayer audioUrl={entry.audio_url} duration={entry.duration} />
        </div>

        {entry.insights && (
          <div className="mt-4 p-4 bg-gradient-soft rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-sm">Insights da IA</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">{entry.insights}</p>
            
            {entry.insights_audio_url && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-2 mb-2 text-primary/80">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-xs font-medium">Ouça o resumo:</span>
                </div>
                <AudioPlayer audioUrl={entry.insights_audio_url} duration={30} />
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
