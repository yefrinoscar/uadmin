-- Create the company_clients table
CREATE TABLE IF NOT EXISTS company_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ruc TEXT NOT NULL UNIQUE,
  address TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for searching by name
CREATE INDEX IF NOT EXISTS company_clients_name_idx ON company_clients (name);

-- Create an index for searching by RUC
CREATE INDEX IF NOT EXISTS company_clients_ruc_idx ON company_clients (ruc);

-- Enable Row Level Security
ALTER TABLE company_clients ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow users to see their own clients
CREATE POLICY "Users can view their own clients"
  ON company_clients FOR SELECT
  USING (auth.uid()::TEXT = created_by::TEXT);

-- Allow users to insert their own clients
CREATE POLICY "Users can insert their own clients"
  ON company_clients FOR INSERT
  WITH CHECK (auth.uid()::TEXT = created_by::TEXT);

-- Allow users to update their own clients
CREATE POLICY "Users can update their own clients"
  ON company_clients FOR UPDATE
  USING (auth.uid()::TEXT = created_by::TEXT);

-- Allow users to delete their own clients
CREATE POLICY "Users can delete their own clients"
  ON company_clients FOR DELETE
  USING (auth.uid()::TEXT = created_by::TEXT);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on company_clients
CREATE TRIGGER update_company_clients_updated_at
BEFORE UPDATE ON company_clients
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add comment to explain the purpose of the table
COMMENT ON TABLE company_clients IS 'Stores client information for proforma invoices'; 