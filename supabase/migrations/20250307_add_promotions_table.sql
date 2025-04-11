CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT false,
  is_main BOOLEAN DEFAULT false,
  terms_and_conditions TEXT,
  button_text VARCHAR(100),
  button_url TEXT,
  tags TEXT[],
  background_color VARCHAR(50) DEFAULT '#FFFFFF',
  text_color VARCHAR(50) DEFAULT '#000000',
  button_background_color VARCHAR(50) DEFAULT '#000000',
  button_text_color VARCHAR(50) DEFAULT '#FFFFFF',
  condition_type TEXT DEFAULT 'none',
  condition_value VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create RLS policies for promotions table
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select promotions
CREATE POLICY "Users can view all promotions"
  ON public.promotions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert promotions
CREATE POLICY "Users can insert their own promotions"
  ON public.promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update promotions
CREATE POLICY "Users can update their own promotions"
  ON public.promotions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete promotions
CREATE POLICY "Users can delete their own promotions"
  ON public.promotions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow public users to view only active promotions
CREATE POLICY "Allow public users to view active promotions"
  ON public.promotions
  FOR SELECT
  TO anon
  USING (
    active = true 
    AND start_date <= NOW()
    AND end_date > NOW()
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.promotions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create index for common queries
CREATE INDEX IF NOT EXISTS promotions_active_dates_idx
ON public.promotions (active, start_date, end_date);

-- Grant permissions
GRANT ALL ON public.promotions TO authenticated;
GRANT USAGE ON SEQUENCE public.promotions_id_seq TO authenticated;
GRANT SELECT ON public.promotions TO anon;
