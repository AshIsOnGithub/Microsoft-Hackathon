-- Create the symptom_history table to store user symptom checks
CREATE TABLE IF NOT EXISTS public.symptom_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create an RLS policy to ensure users can only view their own symptom history
ALTER TABLE public.symptom_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own symptom history"
  ON public.symptom_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symptom history"
  ON public.symptom_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create an index on user_id for faster queries
CREATE INDEX symptom_history_user_id_idx ON public.symptom_history(user_id);

-- Function to automatically update updated_at on record update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER set_symptom_history_updated_at
BEFORE UPDATE ON public.symptom_history
FOR EACH ROW
EXECUTE FUNCTION set_updated_at(); 