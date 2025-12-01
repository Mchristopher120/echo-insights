-- Create journal_entries table
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  insights TEXT,
  transcript TEXT
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own entries"
  ON public.journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entries"
  ON public.journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON public.journal_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON public.journal_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_journal_entries_user_created ON public.journal_entries(user_id, created_at DESC);

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('journal-audio', 'journal-audio', false);

-- Storage policies for audio files
CREATE POLICY "Users can view their own audio"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'journal-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own audio"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'journal-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'journal-audio' AND auth.uid()::text = (storage.foldername(name))[1]);