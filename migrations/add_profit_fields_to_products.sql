-- Migration: Add profit fields to products table
-- Description: Adds base_price and profit_amount columns to the products table

-- Step 1: Add the new columns
ALTER TABLE products
ADD COLUMN base_price DECIMAL(10, 2),
ADD COLUMN profit_amount DECIMAL(10, 2);

-- Step 2: Initialize the columns with default values
-- Set base_price equal to price (assuming all existing products have no profit)
-- Set profit_amount to 0
UPDATE products
SET base_price = price,
    profit_amount = 0
WHERE base_price IS NULL;

-- Step 3: Add any necessary indexes
CREATE INDEX idx_products_base_price ON products(base_price);
CREATE INDEX idx_products_profit_amount ON products(profit_amount);

-- Step 4: Add constraints to ensure price = base_price + profit_amount
-- This is a soft constraint via a trigger
CREATE OR REPLACE FUNCTION update_price_from_profit()
RETURNS TRIGGER AS $$
BEGIN
    -- If base_price or profit_amount changes, update the price
    NEW.price = COALESCE(NEW.base_price, 0) + COALESCE(NEW.profit_amount, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_price_from_profit
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_price_from_profit();

-- Step 5: Add a comment to explain the columns
COMMENT ON COLUMN products.base_price IS 'The base price of the product before profit';
COMMENT ON COLUMN products.profit_amount IS 'The profit amount added to the base price';
