-- Migration to update purchase_requests status column to match the Zod schema
-- status: z.enum(["pending", "in_progress", "in_transit", "completed", "cancelled", "delivered"]).nullable()

-- First, check if we need to create a constraint for the status column
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'purchase_requests_status_check' AND conrelid = 'purchase_requests'::regclass
    ) THEN
        ALTER TABLE purchase_requests DROP CONSTRAINT purchase_requests_status_check;
    END IF;
    
    -- Add a new constraint to ensure status values match our enum
    ALTER TABLE purchase_requests 
    ADD CONSTRAINT purchase_requests_status_check 
    CHECK (status IN ('pending', 'in_progress', 'in_transit', 'completed', 'cancelled', 'delivered') OR status IS NULL);
END $$;

-- Update existing statuses to match new values
UPDATE purchase_requests 
SET status = 
    CASE 
        WHEN status = 'approved' THEN 'completed'
        WHEN status = 'rejected' THEN 'cancelled'
        WHEN status = 'pending' THEN 'pending'
        ELSE 'pending'
    END;

-- Add a comment to the status column
COMMENT ON COLUMN purchase_requests.status IS 'Status of the purchase request: pending, in_progress, in_transit, completed, cancelled, delivered';
