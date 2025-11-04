-- Migration to create exchange_rates table for storing daily exchange rates from Decolecta API
-- This table will store the USD to PEN exchange rate fetched daily

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buy_price DECIMAL(10, 4) NOT NULL,
  sell_price DECIMAL(10, 4) NOT NULL,
  base_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  quote_currency VARCHAR(3) NOT NULL DEFAULT 'PEN',
  date DATE NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster date lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date DESC);

-- Add comment to the table
COMMENT ON TABLE exchange_rates IS 'Stores daily exchange rates from Decolecta API (USD to PEN)';
COMMENT ON COLUMN exchange_rates.buy_price IS 'Price for buying USD (compra)';
COMMENT ON COLUMN exchange_rates.sell_price IS 'Price for selling USD (venta)';
COMMENT ON COLUMN exchange_rates.date IS 'Date of the exchange rate';
