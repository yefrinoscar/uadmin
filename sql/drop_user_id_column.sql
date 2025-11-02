-- Drop RLS policies that depend on user_id column
DROP POLICY IF EXISTS "Users can insert collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete collections" ON public.collections;

-- Now drop the user_id column
ALTER TABLE public.collections DROP COLUMN IF EXISTS user_id;

-- Recreate simpler RLS policies without user_id
-- Allow all authenticated users to insert collections
CREATE POLICY "Authenticated users can insert collections"
  ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow all authenticated users to update collections
CREATE POLICY "Authenticated users can update collections"
  ON public.collections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow all authenticated users to delete collections
CREATE POLICY "Authenticated users can delete collections"
  ON public.collections
  FOR DELETE
  TO authenticated
  USING (true);
