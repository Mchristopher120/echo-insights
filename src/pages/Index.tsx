import { useState, useEffect } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { EntryCard } from '@/components/EntryCard';
import { Card } from '@/components/ui/card';
import { BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Entry {
  id: string;
  audioUrl: string;
  duration: number;
  date: Date;
  insights?: string;
}

const Index = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  // Load entries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('journal-entries');
    if (stored) {
      const parsed = JSON.parse(stored);
      setEntries(
        parsed.map((e: any) => ({
          ...e,
          date: new Date(e.date),
        }))
      );
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('journal-entries', JSON.stringify(entries));
    }
  }, [entries]);

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const newEntry: Entry = {
      id: Date.now().toString(),
      audioUrl,
      duration,
      date: new Date(),
    };
    
    setEntries((prev) => [newEntry, ...prev]);
    toast.success('Entrada adicionada ao diário');
  };

  const handleGenerateInsights = async (entryId: string) => {
    setGeneratingId(entryId);
    
    // Simulação de chamada à API (você integrará com Gemini no backend)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const mockInsights = [
      'Você demonstrou gratidão em várias situações hoje. Continue cultivando esse sentimento positivo.',
      'Foi um dia produtivo! Você mencionou ter concluído várias tarefas importantes.',
      'Percebi que você está focando mais no autocuidado. Isso é excelente para seu bem-estar.',
      'Hoje você expressou alguns desafios. Lembre-se: obstáculos são oportunidades de crescimento.',
      'Você parece estar mais presente e atento às suas emoções. Continue esse caminho de autoconhecimento.',
    ];
    
    const randomInsight = mockInsights[Math.floor(Math.random() * mockInsights.length)];
    
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, insights: randomInsight } : entry
      )
    );
    
    setGeneratingId(null);
    toast.success('Insights gerados com sucesso!');
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">
                Diário Inteligente
              </h1>
              <p className="text-sm text-muted-foreground">
                Registre seus momentos com IA
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Recording Section */}
        <section className="mb-12">
          <Card className="p-8 bg-card shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-xl font-serif font-semibold mb-2">
                Como foi seu dia?
              </h2>
              <p className="text-muted-foreground text-sm">
                Grave um áudio contando sobre suas experiências
              </p>
            </div>
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />
          </Card>
        </section>

        {/* Entries Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-serif font-semibold">Suas Entradas</h2>
          </div>

          {entries.length === 0 ? (
            <Card className="p-12 text-center shadow-md">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma entrada ainda. Comece gravando seu primeiro áudio!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onGenerateInsights={handleGenerateInsights}
                  isGenerating={generatingId === entry.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
