import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AudioRecorder } from '@/components/AudioRecorder';
import { EntryCard } from '@/components/EntryCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Sparkles, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { groupEntriesByMonth, groupEntriesByWeek, Entry } from '@/lib/utils/dateHelpers';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load entries from database
  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error('Erro ao carregar entradas');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    if (!user) return;

    try {
      // Upload audio to storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('journal-audio')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('journal-audio')
        .getPublicUrl(fileName);

      // Save entry to database
      const { data, error: insertError } = await supabase
        .from('journal_entries')
        .insert({
          user_id: user.id,
          audio_url: urlData.publicUrl,
          duration,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setEntries((prev) => [data, ...prev]);
      toast.success('Entrada adicionada ao diário');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Erro ao salvar entrada');
    }
  };

  const handleGenerateInsights = async (entryId: string) => {
    setGeneratingId(entryId);

    // Simulação - você integrará com Gemini no backend
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockInsights = [
      'Você demonstrou gratidão em várias situações hoje. Continue cultivando esse sentimento positivo.',
      'Foi um dia produtivo! Você mencionou ter concluído várias tarefas importantes.',
      'Percebi que você está focando mais no autocuidado. Isso é excelente para seu bem-estar.',
      'Hoje você expressou alguns desafios. Lembre-se: obstáculos são oportunidades de crescimento.',
      'Você parece estar mais presente e atento às suas emoções. Continue esse caminho de autoconhecimento.',
    ];

    const randomInsight = mockInsights[Math.floor(Math.random() * mockInsights.length)];

    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ insights: randomInsight })
        .eq('id', entryId);

      if (error) throw error;

      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === entryId ? { ...entry, insights: randomInsight } : entry
        )
      );

      toast.success('Insights gerados com sucesso!');
    } catch (error) {
      console.error('Error updating insights:', error);
      toast.error('Erro ao salvar insights');
    } finally {
      setGeneratingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const groupedEntries = viewMode === 'week' 
    ? groupEntriesByWeek(entries)
    : groupEntriesByMonth(entries);

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground">
                  Diário Inteligente
                </h1>
                <p className="text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-serif font-semibold">Suas Entradas</h2>
            </div>

            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'month')}>
              <TabsList>
                <TabsTrigger value="week">Por Semana</TabsTrigger>
                <TabsTrigger value="month">Por Mês</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {entries.length === 0 ? (
            <Card className="p-12 text-center shadow-md">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhuma entrada ainda. Comece gravando seu primeiro áudio!
              </p>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedEntries).map(([key, group]) => (
                <div key={key}>
                  <h3 className="text-lg font-semibold mb-4 text-primary">
                    {group.label}
                  </h3>
                  <div className="space-y-4">
                    {group.entries.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={{
                          ...entry,
                          date: new Date(entry.created_at),
                        }}
                        onGenerateInsights={handleGenerateInsights}
                        isGenerating={generatingId === entry.id}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
