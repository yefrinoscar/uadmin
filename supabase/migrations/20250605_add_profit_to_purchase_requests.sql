-- Migration: Add profit column to purchase_requests table
-- Description: Adds a profit column to store additional profit (separate from product profits)
-- The total profit will be: sum(products.profit_amount) + purchase_requests.profit

-- Step 1: Add the profit column
ALTER TABLE purchase_requests
ADD COLUMN profit DECIMAL(10, 2) DEFAULT 0;

-- Step 2: Add a comment to explain the column
COMMENT ON COLUMN purchase_requests.profit IS 'Additional profit for the purchase request (in USD). Total profit = sum of product profits + this value';

-- Step 3: Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_requests_profit ON purchase_requests(profit);

-- Step 4: Update existing records to set profit to 0 if NULL
UPDATE purchase_requests
SET profit = 0
WHERE profit IS NULL;

-- Step 5: Create a function to calculate total profit (products + additional)
CREATE OR REPLACE FUNCTION calculate_total_profit(request_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    products_profit DECIMAL(10, 2);
    additional_profit DECIMAL(10, 2);
    exchange_rate DECIMAL(10, 4);
BEGIN
    -- Get the exchange rate for the request
    SELECT pr.exchange_rate INTO exchange_rate
    FROM purchase_requests pr
    WHERE pr.id = request_id;
    
    -- Sum all product profits (in PEN) and convert to USD
    SELECT COALESCE(SUM(p.profit_amount), 0) / COALESCE(exchange_rate, 3.65) INTO products_profit
    FROM products p
    WHERE p.request_id = request_id;
    
    -- Get additional profit from purchase_requests (already in USD)
    SELECT COALESCE(pr.profit, 0) INTO additional_profit
    FROM purchase_requests pr
    WHERE pr.id = request_id;
    
    -- Return total profit
    RETURN products_profit + additional_profit;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Add a comment to the function
COMMENT ON FUNCTION calculate_total_profit(UUID) IS 'Calculates total profit for a purchase request: sum(products.profit_amount in USD) + purchase_requests.profit';
