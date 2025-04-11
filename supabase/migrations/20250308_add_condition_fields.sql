-- Create enum type for promotion condition types
CREATE TYPE promotion_condition_type AS ENUM (
  'minimum_purchase',
  'specific_products',
  'first_purchase',
  'loyalty_program',
  'student_discount',
  'seasonal_offer',
  'none'
);

-- Add condition columns
ALTER TABLE public.promotions
ADD COLUMN IF NOT EXISTS condition_type promotion_condition_type DEFAULT 'none',
ADD COLUMN IF NOT EXISTS condition_value VARCHAR(255);

-- Update existing rows
UPDATE public.promotions
SET 
  condition_type = 'none'
WHERE condition_type IS NULL; 