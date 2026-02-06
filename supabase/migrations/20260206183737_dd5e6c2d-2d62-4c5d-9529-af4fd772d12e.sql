-- Enable realtime for call_sessions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;

-- Add RLS policy to allow authenticated users to read profiles (for displaying names in chat)
CREATE POLICY "Authenticated users can view all profiles for chat" 
ON public.profiles FOR SELECT TO authenticated 
USING (true);