-- Create proforma table
CREATE TABLE IF NOT EXISTS public.proforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(50) NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  notes TEXT,
  conditions JSONB NOT NULL DEFAULT '{
    "includeIGV": true,
    "validityPeriodDays": 30,
    "deliveryTime": "immediate",
    "paymentMethod": "cash"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proforma items table
CREATE TABLE IF NOT EXISTS public.proforma_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proforma_id UUID REFERENCES public.proforma(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.proforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proforma_items ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX proforma_company_id_idx ON public.proforma(company_id);
CREATE INDEX proforma_client_id_idx ON public.proforma(client_id);
CREATE INDEX proforma_seller_id_idx ON public.proforma(seller_id);
CREATE INDEX proforma_items_proforma_id_idx ON public.proforma_items(proforma_id);
CREATE INDEX proforma_items_product_id_idx ON public.proforma_items(product_id);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.proforma
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.proforma_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at(); 