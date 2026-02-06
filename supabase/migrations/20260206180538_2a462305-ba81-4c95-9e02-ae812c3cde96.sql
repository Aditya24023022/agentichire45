-- Add INSERT policy for experts to create their own profile
CREATE POLICY "Users can create their own expert profile"
ON public.experts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);