-- Create collections table for Shopify collections management
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
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Create RLS policies for collections table
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select collections
CREATE POLICY "Users can view all collections"
  ON public.collections
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert collections
CREATE POLICY "Users can insert collections"
  ON public.collections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update collections
CREATE POLICY "Users can update collections"
  ON public.collections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete collections
CREATE POLICY "Users can delete collections"
  ON public.collections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow public users to view published collections
CREATE POLICY "Public can view published collections"
  ON public.collections
  FOR SELECT
  TO anon
  USING (published = true);

-- Create storage policies for collection media
CREATE POLICY "Allow authenticated users to upload collection images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = 'collections');

CREATE POLICY "Allow authenticated users to upload collection videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = 'collections');

CREATE POLICY "Allow public to read collection media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images' AND (storage.foldername(name))[1] = 'collections');

-- Create or replace the updated_at trigger function (in case it doesn't exist)
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS collections_handle_idx ON public.collections (handle);
CREATE INDEX IF NOT EXISTS collections_shopify_id_idx ON public.collections (shopify_id);
CREATE INDEX IF NOT EXISTS collections_published_idx ON public.collections (published);
CREATE INDEX IF NOT EXISTS collections_sort_order_idx ON public.collections (sort_order);

-- Grant permissions
GRANT ALL ON public.collections TO authenticated;
GRANT SELECT ON public.collections TO anon;
