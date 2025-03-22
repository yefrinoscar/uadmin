-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('category', 'specific_products')),
  condition_content TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for promotions table
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select promotions
CREATE POLICY "Allow authenticated users to select promotions"
  ON promotions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert promotions
CREATE POLICY "Allow authenticated users to insert promotions"
  ON promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update promotions
CREATE POLICY "Allow authenticated users to update promotions"
  ON promotions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete promotions
CREATE POLICY "Allow authenticated users to delete promotions"
  ON promotions
  FOR DELETE
  TO authenticated
  USING (true);
