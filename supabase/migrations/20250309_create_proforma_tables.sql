-- Create company_clients table
CREATE TABLE IF NOT EXISTS public.company_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  ruc VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ruc)
);

-- Create products table if not exists
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  warranty_months INTEGER DEFAULT 0,
  unit VARCHAR(50) DEFAULT 'unit',
  brand VARCHAR(100),
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(code)
);

-- Create proforma table
CREATE TABLE IF NOT EXISTS public.proforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(50) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  client_id UUID REFERENCES public.company_clients(id) NOT NULL,
  seller_id UUID REFERENCES public.users(id) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  notes TEXT,
  warranty_months INTEGER DEFAULT 12,
  currency VARCHAR(10) DEFAULT 'PEN',
  exchange_rate DECIMAL(10,2) DEFAULT 1.00,
  -- Conditions as specific columns
  include_igv BOOLEAN NOT NULL DEFAULT true,
  validity_period_days INTEGER NOT NULL DEFAULT 30,
  delivery_time VARCHAR(50) NOT NULL DEFAULT 'Inmediata',
  payment_method VARCHAR(50) NOT NULL DEFAULT 'CONTADO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(number)
);

-- Create proforma items table
CREATE TABLE IF NOT EXISTS public.proforma_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proforma_id UUID REFERENCES public.proforma(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1
    CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0
    CHECK (unit_price >= 0),
  discount_percent DECIMAL(5,2) DEFAULT 0
    CHECK (discount_percent >= 0 AND discount_percent <= 100),
  total DECIMAL(10,2) NOT NULL DEFAULT 0
    CHECK (total >= 0),
  warranty_months INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.company_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_items ENABLE ROW LEVEL SECURITY;

-- Create policies for company_clients
CREATE POLICY "Allow authenticated users to view clients" ON public.company_clients
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create clients" ON public.company_clients
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update clients" ON public.company_clients
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete clients" ON public.company_clients
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for products
CREATE POLICY "Allow authenticated users to view products" ON public.products
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create products" ON public.products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update products" ON public.products
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete products" ON public.products
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for proforma
CREATE POLICY "Allow authenticated users to view proformas" ON public.proforma
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create proformas" ON public.proforma
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update their proformas" ON public.proforma
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete their proformas" ON public.proforma
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for proforma items
CREATE POLICY "Allow authenticated users to view proforma items" ON public.proforma_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create proforma items" ON public.proforma_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update proforma items" ON public.proforma_items
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete proforma items" ON public.proforma_items
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX company_clients_ruc_idx ON public.company_clients(ruc);
CREATE INDEX products_code_idx ON public.products(code);
CREATE INDEX proforma_number_idx ON public.proforma(number);
CREATE INDEX proforma_client_id_idx ON public.proforma(client_id);
CREATE INDEX proforma_seller_id_idx ON public.proforma(seller_id);
CREATE INDEX proforma_items_proforma_id_idx ON public.proforma_items(proforma_id);
CREATE INDEX proforma_items_product_id_idx ON public.proforma_items(product_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.company_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.proforma
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.proforma_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at(); 