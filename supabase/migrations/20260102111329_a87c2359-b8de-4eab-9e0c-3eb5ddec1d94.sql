-- Create user_credits table
CREATE TABLE public.user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    credits INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY "Users can view own credits"
ON public.user_credits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own credits row
CREATE POLICY "Users can insert own credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all credits
CREATE POLICY "Admins can manage all credits"
ON public.user_credits
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create credit_transactions table for tracking purchases
CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    credits_added INTEGER NOT NULL,
    transaction_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON public.credit_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create transactions
CREATE POLICY "Users can create transactions"
ON public.credit_transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all transactions
CREATE POLICY "Admins can manage all transactions"
ON public.credit_transactions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_user_credits_updated_at
BEFORE UPDATE ON public.user_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_transactions_updated_at
BEFORE UPDATE ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();