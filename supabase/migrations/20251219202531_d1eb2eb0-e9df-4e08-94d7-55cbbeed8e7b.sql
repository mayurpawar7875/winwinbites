-- Add ship_to address column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN ship_to_address TEXT;