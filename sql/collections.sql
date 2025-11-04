-- Collections table for storing Shopify collections with custom media
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id VARCHAR(255) UNIQUE NOT NULL,
  handle VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  sort_order INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  shopify_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_collections_shopify_id ON collections(shopify_id);
CREATE INDEX IF NOT EXISTS idx_collections_handle ON collections(handle);
CREATE INDEX IF NOT EXISTS idx_collections_published ON collections(published);
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON collections(sort_order);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_collections_updated_at ON collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE collections IS 'Stores Shopify collections with custom images and videos';
COMMENT ON COLUMN collections.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN collections.shopify_id IS 'Unique Shopify collection ID';
COMMENT ON COLUMN collections.handle IS 'URL-friendly collection handle';
COMMENT ON COLUMN collections.title IS 'Collection display title';
COMMENT ON COLUMN collections.description IS 'Collection description';
COMMENT ON COLUMN collections.image_url IS 'Custom collection image URL';
COMMENT ON COLUMN collections.video_url IS 'Custom collection video URL';
COMMENT ON COLUMN collections.sort_order IS 'Display order (lower numbers first)';
COMMENT ON COLUMN collections.published IS 'Whether the collection is published';
COMMENT ON COLUMN collections.shopify_data IS 'Raw Shopify collection data';
COMMENT ON COLUMN collections.synced_at IS 'Last sync timestamp from Shopify';
COMMENT ON COLUMN collections.user_id IS 'User who created/synced the collection';
