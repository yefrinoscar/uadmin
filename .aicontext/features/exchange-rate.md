# Exchange Rate Feature

## Overview
System to fetch USD to PEN exchange rate from Decolecta API and store in database.

## Implementation
- Cron job runs daily at 9 AM Peru time (14:00 UTC)
- Stores exchange rate in `exchange_rates` table
- Public API to get current rate
- Editable in UI (TotalSummaryCard component)

## Files
- Migration: `supabase/migrations/20250604_create_exchange_rates_table.sql`
- Cron API: `app/api/exchange-rate/cron/route.ts`
- Current API: `app/api/exchange-rate/current/route.ts`
- tRPC Router: `trpc/api/routers/exchangeRate.ts`
- UI Component: `app/(dashboard)/dashboard/requests/[id]/components/TotalSummaryCard.tsx`
- Store: `store/requestDetailStore.ts` (setExchangeRate action)

## Configuration
- Vercel cron: `vercel.json`
- Schedule: `0 14 * * *` (9 AM Peru time)
- API Key: `DECOLECTA_API_KEY` env variable
- Cron Secret: `CRON_SECRET` env variable

## Usage
- Database value takes priority over request value
- Users can edit manually if needed
- Saves to database on "Guardar Cambios"
