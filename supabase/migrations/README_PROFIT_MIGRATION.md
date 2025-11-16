# Migration: Add Profit Column to Purchase Requests

## Overview
This migration adds a `profit` column to the `purchase_requests` table to store additional profit separate from product profits.

## Profit Structure

### Before Migration
- **Product Profit**: Stored in `products.profit_amount` (in PEN)
- **Total Profit**: Only sum of product profits

### After Migration
- **Product Profit**: `products.profit_amount` (in PEN) - calculated from products, not editable from request
- **Additional Profit**: `purchase_requests.profit` (in USD) - editable from purchase request
- **Total Profit**: `sum(products.profit_amount) / exchange_rate + purchase_requests.profit`

## Formula

```
Total Profit (USD) = (Σ Product Profits in PEN / Exchange Rate) + Additional Profit (USD)
```

## Database Changes

### New Column
- **Table**: `purchase_requests`
- **Column**: `profit`
- **Type**: `DECIMAL(10, 2)`
- **Default**: `0`
- **Description**: Additional profit for the purchase request (in USD)

### New Function
- **Function**: `calculate_total_profit(request_id UUID)`
- **Returns**: `DECIMAL(10, 2)`
- **Description**: Calculates total profit combining product profits and additional profit

## How to Run Migration

### Using Supabase CLI

```bash
# Navigate to project root
cd c:\Users\ylaurach\prj\uadmin

# Run the migration
supabase db push
```

### Manual SQL Execution

1. Connect to your Supabase database
2. Execute the SQL file: `20250605_add_profit_to_purchase_requests.sql`

## Example Usage

### Query Total Profit
```sql
SELECT 
  pr.id,
  pr.description,
  calculate_total_profit(pr.id) as total_profit,
  pr.profit as additional_profit
FROM purchase_requests pr;
```

### Update Additional Profit
```sql
UPDATE purchase_requests
SET profit = 10.50
WHERE id = 'your-request-id';
```

## TypeScript Integration

The TypeScript schema already includes the `profit` field:

```typescript
const PurchaseRequestSchema = z.object({
  // ... other fields
  profit: z.number().optional().nullable().default(0),
  // ... other fields
});
```

## UI Changes

The `TotalSummaryCard` component now displays:
- **Product Profit**: From `products.profit_amount` (read-only)
- **Additional Profit**: From `purchase_requests.profit` (editable)
- **Total Profit**: Sum of both

## Rollback

If you need to rollback this migration:

```sql
-- Remove the function
DROP FUNCTION IF EXISTS calculate_total_profit(UUID);

-- Remove the index
DROP INDEX IF EXISTS idx_purchase_requests_profit;

-- Remove the column
ALTER TABLE purchase_requests DROP COLUMN IF EXISTS profit;
```

## Notes

- All existing records will have `profit = 0` by default
- The profit is stored in USD (not PEN)
- Product profits remain in PEN and are converted when calculating total
- The exchange rate used is from `purchase_requests.exchange_rate`
