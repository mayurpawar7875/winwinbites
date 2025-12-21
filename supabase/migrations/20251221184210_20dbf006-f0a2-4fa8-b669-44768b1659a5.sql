-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS policies for customers
CREATE POLICY "Users can view their own customers"
ON public.customers FOR SELECT
USING ((auth.uid() = created_by) AND is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own customers"
ON public.customers FOR INSERT
WITH CHECK ((auth.uid() = created_by) AND is_user_active(auth.uid()));

CREATE POLICY "Users can update their own customers"
ON public.customers FOR UPDATE
USING ((auth.uid() = created_by) AND is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own customers"
ON public.customers FOR DELETE
USING ((auth.uid() = created_by) AND is_user_active(auth.uid()));

-- Create payment_status enum
CREATE TYPE public.invoice_payment_status AS ENUM ('UNPAID', 'PARTIAL', 'PAID');

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  billing_address TEXT,
  ship_to_address TEXT,
  sub_total DOUBLE PRECISION NOT NULL DEFAULT 0,
  discount DOUBLE PRECISION NOT NULL DEFAULT 0,
  gst_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
  gst_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  grand_total DOUBLE PRECISION NOT NULL DEFAULT 0,
  payment_status public.invoice_payment_status NOT NULL DEFAULT 'UNPAID',
  amount_paid DOUBLE PRECISION NOT NULL DEFAULT 0,
  balance_due DOUBLE PRECISION NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(invoice_no, created_by)
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
CREATE POLICY "Users can view their own invoices"
ON public.invoices FOR SELECT
USING ((auth.uid() = created_by) AND is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own invoices"
ON public.invoices FOR INSERT
WITH CHECK ((auth.uid() = created_by) AND is_user_active(auth.uid()));

CREATE POLICY "Users can update their own invoices"
ON public.invoices FOR UPDATE
USING ((auth.uid() = created_by) AND is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own invoices"
ON public.invoices FOR DELETE
USING ((auth.uid() = created_by) AND is_user_active(auth.uid()));

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  rate DOUBLE PRECISION NOT NULL,
  line_total DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoice_items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_items (inherit from parent invoice)
CREATE POLICY "Users can view their own invoice items"
ON public.invoice_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.created_by = auth.uid()
  AND is_user_active(auth.uid())
));

CREATE POLICY "Users can insert their own invoice items"
ON public.invoice_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.created_by = auth.uid()
  AND is_user_active(auth.uid())
));

CREATE POLICY "Users can update their own invoice items"
ON public.invoice_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.created_by = auth.uid()
  AND is_user_active(auth.uid())
));

CREATE POLICY "Users can delete their own invoice items"
ON public.invoice_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.invoices 
  WHERE invoices.id = invoice_items.invoice_id 
  AND invoices.created_by = auth.uid()
  AND is_user_active(auth.uid())
));

-- Create collection_payment_mode enum
CREATE TYPE public.collection_payment_mode AS ENUM ('CASH', 'UPI', 'ONLINE', 'BANK');

-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_date DATE NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  customer_id UUID REFERENCES public.customers(id),
  amount_received DOUBLE PRECISION NOT NULL,
  mode_of_payment public.collection_payment_mode NOT NULL,
  reference_no TEXT,
  remarks TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS policies for collections
CREATE POLICY "Users can view their own collections"
ON public.collections FOR SELECT
USING ((auth.uid() = created_by) AND is_user_active(auth.uid()));

CREATE POLICY "Users can insert their own collections"
ON public.collections FOR INSERT
WITH CHECK ((auth.uid() = created_by) AND is_user_active(auth.uid()));

CREATE POLICY "Users can update their own collections"
ON public.collections FOR UPDATE
USING ((auth.uid() = created_by) AND is_user_active(auth.uid()));

CREATE POLICY "Users can delete their own collections"
ON public.collections FOR DELETE
USING ((auth.uid() = created_by) AND is_user_active(auth.uid()));

-- Create trigger for updating invoices.updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month TEXT;
  next_seq INT;
  invoice_prefix TEXT;
BEGIN
  current_month := TO_CHAR(NOW(), 'YYYYMM');
  invoice_prefix := 'INV-' || current_month || '-';
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_no FROM LENGTH(invoice_prefix) + 1) AS INT)
  ), 0) + 1
  INTO next_seq
  FROM public.invoices
  WHERE created_by = user_id
  AND invoice_no LIKE invoice_prefix || '%';
  
  RETURN invoice_prefix || LPAD(next_seq::TEXT, 4, '0');
END;
$$;

-- Create function to update invoice payment status
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_paid DOUBLE PRECISION;
  invoice_grand_total DOUBLE PRECISION;
  new_status public.invoice_payment_status;
  new_balance DOUBLE PRECISION;
BEGIN
  -- Calculate total paid for the invoice
  SELECT COALESCE(SUM(amount_received), 0)
  INTO total_paid
  FROM public.collections
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Get invoice grand total
  SELECT grand_total
  INTO invoice_grand_total
  FROM public.invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Determine new status
  IF total_paid >= invoice_grand_total THEN
    new_status := 'PAID';
    new_balance := 0;
  ELSIF total_paid > 0 THEN
    new_status := 'PARTIAL';
    new_balance := invoice_grand_total - total_paid;
  ELSE
    new_status := 'UNPAID';
    new_balance := invoice_grand_total;
  END IF;
  
  -- Update the invoice
  UPDATE public.invoices
  SET 
    amount_paid = total_paid,
    balance_due = new_balance,
    payment_status = new_status,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers to update invoice status on collection changes
CREATE TRIGGER update_invoice_on_collection_insert
AFTER INSERT ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_payment_status();

CREATE TRIGGER update_invoice_on_collection_update
AFTER UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_payment_status();

CREATE TRIGGER update_invoice_on_collection_delete
AFTER DELETE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_payment_status();