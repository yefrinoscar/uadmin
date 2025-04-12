-- Add color columns to promotions table
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS background_color VARCHAR(50) DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS text_color VARCHAR(50) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS button_background_color VARCHAR(50) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS button_text_color VARCHAR(50) DEFAULT '#FFFFFF';

-- Update existing rows to have default colors
UPDATE public.promotions
SET 
  background_color = '#FFFFFF',
  text_color = '#000000',
  button_background_color = '#000000',
  button_text_color = '#FFFFFF'
WHERE 
  background_color IS NULL
  OR text_color IS NULL
  OR button_background_color IS NULL
  OR button_text_color IS NULL; 