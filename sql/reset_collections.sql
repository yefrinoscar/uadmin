-- Drop all RLS policies
DROP POLICY IF EXISTS "Users can view all collections" ON public.collections;
DROP POLICY IF EXISTS "Users can insert collections" ON public.collections;
DROP POLICY IF EXISTS "Users can update collections" ON public.collections;
DROP POLICY IF EXISTS "Users can delete collections" ON public.collections;
DROP POLICY IF EXISTS "Public can view published collections" ON public.collections;
DROP POLICY IF EXISTS "Authenticated users can insert collections" ON public.collections;
DROP POLICY IF EXISTS "Authenticated users can update collections" ON public.collections;
DROP POLICY IF EXISTS "Authenticated users can delete collections" ON public.collections;

-- Drop trigger
DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
DROP TRIGGER IF EXISTS set_collections_updated_at ON public.collections;

-- Drop indexes
DROP INDEX IF EXISTS idx_collections_shopify_id;
DROP INDEX IF EXISTS idx_collections_handle;
DROP INDEX IF EXISTS idx_collections_published;
DROP INDEX IF EXISTS idx_collections_sort_order;
DROP INDEX IF EXISTS idx_collections_user_id;
DROP INDEX IF EXISTS collections_handle_idx;
DROP INDEX IF EXISTS collections_shopify_id_idx;
DROP INDEX IF EXISTS collections_published_idx;
DROP INDEX IF EXISTS collections_sort_order_idx;

-- Drop table
DROP TABLE IF EXISTS public.collections CASCADE;

-- Recreate collections table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id VARCHAR(255) UNIQUE NOT NULL,
  handle VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  banner_url TEXT,
  video_url TEXT,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  shopify_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX idx_collections_shopify_id ON public.collections(shopify_id);
CREATE INDEX idx_collections_handle ON public.collections(handle);
CREATE INDEX idx_collections_published ON public.collections(published);
CREATE INDEX idx_collections_sort_order ON public.collections(sort_order);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all collections
CREATE POLICY "Authenticated users can view all collections"
  ON public.collections
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert collections
CREATE POLICY "Authenticated users can insert collections"
  ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update collections
CREATE POLICY "Authenticated users can update collections"
  ON public.collections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete collections
CREATE POLICY "Authenticated users can delete collections"
  ON public.collections
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow public users to view published collections
CREATE POLICY "Public can view published collections"
  ON public.collections
  FOR SELECT
  TO anon
  USING (published = true);

-- Grant permissions
GRANT ALL ON public.collections TO authenticated;
GRANT SELECT ON public.collections TO anon;

-- Add comments for documentation
COMMENT ON TABLE public.collections IS 'Stores Shopify collections with custom images and videos';
COMMENT ON COLUMN public.collections.id IS 'UUID primary key';
COMMENT ON COLUMN public.collections.shopify_id IS 'Unique Shopify collection ID';
COMMENT ON COLUMN public.collections.handle IS 'URL-friendly collection handle';
COMMENT ON COLUMN public.collections.title IS 'Collection display title';
COMMENT ON COLUMN public.collections.description IS 'Collection description';
COMMENT ON COLUMN public.collections.image_url IS 'Custom collection image URL';
COMMENT ON COLUMN public.collections.video_url IS 'Custom collection video URL';
COMMENT ON COLUMN public.collections.sort_order IS 'Display order (lower numbers first)';
COMMENT ON COLUMN public.collections.published IS 'Whether the collection is published';
COMMENT ON COLUMN public.collections.shopify_data IS 'Raw Shopify collection data';
COMMENT ON COLUMN public.collections.synced_at IS 'Last sync timestamp from Shopify';
