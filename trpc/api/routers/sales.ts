import { z } from 'zod'
import { router, protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import type { Sale } from '@/types/sale'

// Create a schema for sales
const saleSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "RESERVED"]),
  quantity_sold: z.number().default(0),
  link: z.string().optional(),
  purchase_date: z.string().optional(),
  sale_date: z.string().optional(),
  size: z.string().optional(),
  total_price_usd: z.number(),
  traveler_cost: z.number().optional(),
  warehouse_mobility: z.number().optional(),
  exchange_rate: z.number(),
  peru_price: z.number(),
  sale_price: z.number().optional(),
  shipping: z.number().optional(),
  quantity: z.number().default(1),
  profit: z.number().optional(),
  real_profit: z.number().optional(),
})

// Create schema for filters
const saleFilterSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "RESERVED"]).optional(),
  name: z.string().optional(),
  dateRange: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional(),
  dateType: z.enum(["purchase_date", "sale_date"]).optional(),
  datePeriod: z.enum(["current_month", "last_month", "current_year", "all"]).optional(),
})

// Create schema for pagination
const paginationSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(10),
})

export const salesRouter = router({
  getAll: protectedProcedure
    .input(z.object({
      filters: saleFilterSchema.optional(),
      pagination: paginationSchema.optional(),
      sorting: z.object({
        field: z.string().optional(),
        direction: z.enum(["asc", "desc"]).optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        let query = ctx.supabase
          .from('sales')
          .select('*', { count: 'exact' });

        // Apply filters
        if (input.filters) {
          if (input.filters.status) {
            query = query.eq('status', input.filters.status);
          }

          if (input.filters.name) {
            query = query.ilike('name', `%${input.filters.name}%`);
          }

          // Date filtering
          if (input.filters.dateType && input.filters.datePeriod) {
            const dateField = input.filters.dateType;
            const now = new Date();
            
            if (input.filters.datePeriod === 'current_month') {
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
              const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
              query = query.gte(dateField, startOfMonth).lte(dateField, endOfMonth);
            } 
            else if (input.filters.datePeriod === 'last_month') {
              const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
              const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
              query = query.gte(dateField, startOfLastMonth).lte(dateField, endOfLastMonth);
            }
            else if (input.filters.datePeriod === 'current_year') {
              const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
              const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString();
              query = query.gte(dateField, startOfYear).lte(dateField, endOfYear);
            }
          }

          // Custom date range
          if (input.filters.dateType && input.filters.dateRange) {
            const dateField = input.filters.dateType;
            
            if (input.filters.dateRange.from) {
              query = query.gte(dateField, input.filters.dateRange.from);
            }
            
            if (input.filters.dateRange.to) {
              query = query.lte(dateField, input.filters.dateRange.to);
            }
          }
        }

        // Apply sorting
        if (input.sorting && input.sorting.field) {
          const direction = input.sorting.direction || 'desc';
          query = query.order(input.sorting.field, { ascending: direction === 'asc' });
        } else {
          // Default sorting by created_at desc
          query = query.order('created_at', { ascending: false });
        }

        // Apply pagination
        if (input.pagination) {
          const { page, pageSize } = input.pagination;
          const from = (page - 1) * pageSize;
          const to = from + pageSize - 1;
          query = query.range(from, to);
        }

        const { data, error, count } = await query;

        if (error) throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        });

        return {
          data: data as Sale[],
          total: count || 0,
          page: input.pagination?.page || 1,
          pageSize: input.pagination?.pageSize || 10,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        });
      }
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('sales')
        .select('*')
        .eq('id', input)
        .single();

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });

      return data as Sale;
    }),

  create: protectedProcedure
    .input(saleSchema)
    .mutation(async ({ ctx, input }) => {
      // Calculate profits if not provided
      const saleData = { ...input };
      
      if (!saleData.profit && saleData.sale_price) {
        saleData.profit = saleData.sale_price - saleData.peru_price;
      }
      
      if (!saleData.real_profit && saleData.sale_price) {
        // Real profit considers shipping costs if available
        const shippingCost = saleData.shipping || 0;
        saleData.real_profit = (saleData.sale_price - saleData.peru_price) - shippingCost;
      }

      const { data, error } = await ctx.supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });

      return data as Sale;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      sale: saleSchema
    }))
    .mutation(async ({ ctx, input }) => {
      // Calculate profits if not provided
      const saleData = { ...input.sale };
      
      if (saleData.sale_price) {
        saleData.profit = saleData.sale_price - saleData.peru_price;
        
        // Real profit considers shipping costs if available
        const shippingCost = saleData.shipping || 0;
        saleData.real_profit = (saleData.sale_price - saleData.peru_price) - shippingCost;
      }

      const { data, error } = await ctx.supabase
        .from('sales')
        .update(saleData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });

      return data as Sale;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('sales')
        .delete()
        .eq('id', input);

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });

      return { success: true };
    }),

  bulkDelete: protectedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('sales')
        .delete()
        .in('id', input);

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      });

      return { success: true };
    }),

  getStats: protectedProcedure
    .input(z.object({
      period: z.enum(["current_month", "last_month", "current_year", "all"]).default("current_month")
    }))
    .query(async ({ ctx, input }) => {
      try {
        const now = new Date();
        let startDate, endDate;
        
        // Set date range based on period
        if (input.period === 'current_month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        } else if (input.period === 'last_month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
          endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
        } else if (input.period === 'current_year') {
          startDate = new Date(now.getFullYear(), 0, 1).toISOString();
          endDate = new Date(now.getFullYear(), 11, 31).toISOString();
        }

        // Build query for total sales
        let salesQuery = ctx.supabase
          .from('sales')
          .select('*');
        
        // Apply date filter if period is not 'all'
        if (input.period !== 'all' && startDate && endDate) {
          salesQuery = salesQuery.gte('sale_date', startDate).lte('sale_date', endDate);
        }
        
        // Only count SOLD items
        salesQuery = salesQuery.eq('status', 'SOLD');
        
        const { data: salesData, error: salesError } = await salesQuery;
        
        if (salesError) throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: salesError.message
        });
        
        // Calculate statistics
        const totalSales = salesData.length;
        const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.sale_price || 0), 0);
        const totalProfit = salesData.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        const totalRealProfit = salesData.reduce((sum, sale) => sum + (sale.real_profit || 0), 0);
        
        return {
          totalSales,
          totalRevenue,
          totalProfit,
          totalRealProfit,
          period: input.period
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        });
      }
    }),
})
