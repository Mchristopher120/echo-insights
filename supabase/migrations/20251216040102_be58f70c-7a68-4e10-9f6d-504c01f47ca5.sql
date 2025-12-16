-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create a policy that allows users to view only their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);