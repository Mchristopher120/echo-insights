-- Update journal-audio bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'journal-audio';