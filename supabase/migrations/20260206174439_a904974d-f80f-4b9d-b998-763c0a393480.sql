-- Create messages table for student-expert communication
CREATE TABLE public.expert_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expert_messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
CREATE POLICY "Users can view their own messages"
  ON public.expert_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.expert_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can update messages (mark read)"
  ON public.expert_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Add user_id to experts table to link with auth
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE;

-- Add contact info for experts
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.experts ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create policy for experts to manage their own profile
CREATE POLICY "Experts can view own profile"
  ON public.experts FOR SELECT
  USING (user_id = auth.uid() OR available = true);

CREATE POLICY "Experts can update own profile"
  ON public.experts FOR UPDATE
  USING (user_id = auth.uid());

-- Add expert role to the enum (if not exists)
DO $$ 
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'expert';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create call sessions table
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  call_type TEXT DEFAULT 'video',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own call sessions"
  ON public.call_sessions FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM experts WHERE id = expert_id));

CREATE POLICY "Users can create call sessions"
  ON public.call_sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update call sessions"
  ON public.call_sessions FOR UPDATE
  USING (auth.uid() = student_id OR auth.uid() IN (SELECT user_id FROM experts WHERE id = expert_id));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.expert_messages;