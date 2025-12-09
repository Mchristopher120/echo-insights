import { useState, useEffect } from 'react';
import axios from 'axios';
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
import { useProfile } from '@/hooks/useProfile';
import { groupEntriesByMonth, groupEntriesByWeek, Entry } from '@/lib/utils/dateHelpers';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
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

  // Redirect to setup profile if no profile exists
  useEffect(() => {
    if (!authLoading && !profileLoading && user && !profile) {
      navigate('/setup-profile');
    }
  }, [user, authLoading, profileLoading, profile, navigate]);

  // Load entries from database
  useEffect(() => {
    if (user && profile) {
      loadEntries();
    }
  }, [user, profile]);

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

    const entry = entries.find(e => e.id === entryId);
    if (!entry) {
        toast.error("Entrada não encontrada");
        setGeneratingId(null);
        return;
    }

    try {
      const audioResponse = await fetch(entry.audio_url);
      const audioBlob = await audioResponse.blob();

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm'); 

      // Chama o backend
      // NOTA: Confirme se sua porta é 1987 mesmo. Se for padrão Spring, é 8080.
      const backendResponse = await axios.post('http://localhost:1987/audio/analyzer/analyze', formData);
      
      // --- MUDANÇA AQUI ---
      // Agora o backend devolve um objeto { insight: "...", audioBase64: "..." }
      const { insight, audioBase64 } = backendResponse.data; 

      // 1. Salvar o TEXTO no Supabase
      const { error } = await supabase
        .from('journal_entries')
        .update({ insights: insight })
        .eq('id', entryId);

      if (error) throw error;

      // 2. Tocar o ÁUDIO gerado pela IA
      if (audioBase64) {
        try {

            const audioSrc = `data:audio/mp3;base64,${audioBase64.replace(/\s/g, '')}`;
            const audioPlayer = new Audio(audioSrc);
            audioPlayer.play();
        } catch (audioErr) {
            console.error("Erro ao reproduzir audio:", audioErr);
        }
      }

 // 3. Atualizar a tela
  setEntries((prev) =>
  prev.map((item) =>
  item.id === entryId ? { ...item, insights: insight } : item
  )
  );

    toast.success('Insights gerados e áudio reproduzido!');
  } catch (error) {
   console.error('Error updating insights:', error);
   toast.error('Erro ao gerar insights com IA');
  } finally {
   setGeneratingId(null);
   }
 };

  if (authLoading || profileLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) return null;

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
                  Olá, {profile.name || profile.username}
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
                          insights_audio_url: entry.insights_audio_url,
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
