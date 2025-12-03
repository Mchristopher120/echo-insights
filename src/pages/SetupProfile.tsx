import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BookOpen, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SetupProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    if (name.trim().length < 2) {
      toast.error('O nome deve ter pelo menos 2 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: name.trim(),
          username: name.trim().toLowerCase().replace(/\s+/g, '_'),
        });

      if (error) throw error;

      toast.success('Perfil criado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Erro ao criar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-primary rounded-xl mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
            Bem-vindo ao Diário Inteligente
          </h1>
          <p className="text-muted-foreground">
            Como você gostaria de ser chamado?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Seu nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Ex: João Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
                minLength={2}
                maxLength={100}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Continuar'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default SetupProfile;
