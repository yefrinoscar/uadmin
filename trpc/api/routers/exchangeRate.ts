import { z } from 'zod';
import { protectedProcedure, router } from '../../init';
import { TRPCError } from '@trpc/server';

const ExchangeRateSchema = z.object({
  id: z.string(),
  buy_price: z.number(),
  sell_price: z.number(),
  base_currency: z.string(),
  quote_currency: z.string(),
  date: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ExchangeRate = z.infer<typeof ExchangeRateSchema>;

export const exchangeRateRouter = router({
  /**
   * Get the current (most recent) exchange rate
   */
  getCurrent: protectedProcedure
    .output(ExchangeRateSchema.nullable())
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from('exchange_rates')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

        
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        console.error('Error fetching current exchange rate:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch current exchange rate'
        });
      }

      console.log('Current exchange rate:', data);

      return data;
    }),

  /**
   * Get exchange rate by specific date
   */
  getByDate: protectedProcedure
    .input(z.object({ date: z.string() }))
    .output(ExchangeRateSchema.nullable())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('exchange_rates')
        .select('*')
        .eq('date', input.date)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching exchange rate by date:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch exchange rate'
        });
      }

      return data;
    }),

  /**
   * Get exchange rate history (last N days)
   */
  getHistory: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(90).default(30) }))
    .output(z.array(ExchangeRateSchema))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('exchange_rates')
        .select('*')
        .order('date', { ascending: false })
        .limit(input.days);

      if (error) {
        console.error('Error fetching exchange rate history:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch exchange rate history'
        });
      }

      return data || [];
    }),

  /**
   * Manually trigger exchange rate fetch (for testing or manual updates)
   */
  triggerFetch: protectedProcedure
    .mutation(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const cronSecret = process.env.CRON_SECRET;

        const response = await fetch(`${baseUrl}/api/exchange-rate/cron`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cronSecret && { 'Authorization': `Bearer ${cronSecret}` })
          }
        });

        if (!response.ok) {
          const error = await response.json();
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.details || 'Failed to trigger exchange rate fetch'
          });
        }

        const data = await response.json();
        return {
          success: true,
          message: data.message,
          data: data.data,
          skipped: data.skipped || false
        };
      } catch (error) {
        console.error('Error triggering exchange rate fetch:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to trigger exchange rate fetch'
        });
      }
    }),
});
