-- Create proformas table
CREATE TABLE IF NOT EXISTS proformas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  client_id UUID NOT NULL REFERENCES company_clients(id),
  seller_id UUID NOT NULL, -- Reference to the user creating the proforma
  subtotal DECIMAL(12, 2) NOT NULL,
  tax DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  notes TEXT,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'PEN')),
  exchange_rate DECIMAL(10, 4) NOT NULL,
  include_igv BOOLEAN NOT NULL DEFAULT true,
  validity_period_days INTEGER NOT NULL DEFAULT 30,
  delivery_time TEXT,
  payment_method TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proforma_items table
CREATE TABLE IF NOT EXISTS proforma_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proforma_id UUID NOT NULL REFERENCES proformas(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  notes TEXT,
  unit TEXT NOT NULL,
  quantity DECIMAL(12, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  warranty_months INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS proformas_client_id_idx ON proformas(client_id);
CREATE INDEX IF NOT EXISTS proformas_seller_id_idx ON proformas(seller_id);
CREATE INDEX IF NOT EXISTS proformas_status_idx ON proformas(status);
CREATE INDEX IF NOT EXISTS proformas_created_by_idx ON proformas(created_by);
CREATE INDEX IF NOT EXISTS proforma_items_proforma_id_idx ON proforma_items(proforma_id);

-- Enable Row Level Security
ALTER TABLE proformas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proforma_items ENABLE ROW LEVEL SECURITY;

-- Create policies for proformas
CREATE POLICY "Users can view their own proformas"
  ON proformas FOR SELECT
  USING (auth.uid()::TEXT = created_by::TEXT);

CREATE POLICY "Users can insert their own proformas"
  ON proformas FOR INSERT
  WITH CHECK (auth.uid()::TEXT = created_by::TEXT);

CREATE POLICY "Users can update their own proformas"
  ON proformas FOR UPDATE
  USING (auth.uid()::TEXT = created_by::TEXT);

CREATE POLICY "Users can delete their own proformas"
  ON proformas FOR DELETE
  USING (auth.uid()::TEXT = created_by::TEXT);

-- Create policies for proforma_items (inherited through proformas)
CREATE POLICY "Users can view their proforma items"
  ON proforma_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proformas
    WHERE proformas.id = proforma_items.proforma_id
    AND auth.uid()::TEXT = proformas.created_by::TEXT
  ));

CREATE POLICY "Users can insert their proforma items"
  ON proforma_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM proformas
    WHERE proformas.id = proforma_items.proforma_id
    AND auth.uid()::TEXT = proformas.created_by::TEXT
  ));

CREATE POLICY "Users can update their proforma items"
  ON proforma_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM proformas
    WHERE proformas.id = proforma_items.proforma_id
    AND auth.uid()::TEXT = proformas.created_by::TEXT
  ));

CREATE POLICY "Users can delete their proforma items"
  ON proforma_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM proformas
    WHERE proformas.id = proforma_items.proforma_id
    AND auth.uid()::TEXT = proformas.created_by::TEXT
  ));

-- Apply trigger for updated_at on proformas
CREATE TRIGGER update_proformas_updated_at
BEFORE UPDATE ON proformas
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Apply trigger for updated_at on proforma_items
CREATE TRIGGER update_proforma_items_updated_at
BEFORE UPDATE ON proforma_items
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add comments
COMMENT ON TABLE proformas IS 'Stores proforma invoice information';
COMMENT ON TABLE proforma_items IS 'Stores line items for proforma invoices'; 