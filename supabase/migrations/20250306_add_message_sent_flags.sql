-- Add email_sent and whatsapp_sent columns to purchase_requests table
ALTER TABLE purchase_requests 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_sent BOOLEAN DEFAULT FALSE;

-- Update existing records to have default values
UPDATE purchase_requests 
SET email_sent = FALSE, whatsapp_sent = FALSE 
WHERE email_sent IS NULL OR whatsapp_sent IS NULL;

-- Add comment to the columns
COMMENT ON COLUMN purchase_requests.email_sent IS 'Flag indicating if an email response has been sent';
COMMENT ON COLUMN purchase_requests.whatsapp_sent IS 'Flag indicating if a WhatsApp response has been sent';
