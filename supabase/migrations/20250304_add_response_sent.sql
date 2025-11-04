-- Add notification_sent_at column to purchase_requests table
ALTER TABLE purchase_requests 
ADD COLUMN notification_sent_at TIMESTAMP WITH TIME ZONE;
