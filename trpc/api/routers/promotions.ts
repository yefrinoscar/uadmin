import { z } from 'zod'
import { router, protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import type { Promotion } from '@/types/promotion'

// Create a schema for promotions
const promotionSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  title: z.string(),
  description: z.string(),
  condition_type: z.string(),
  condition_value: z.string(),
  background_color: z.string(),
  active: z.boolean(),
  is_main: z.boolean(),
  start_date: z.string(),
  end_date: z.string(),
  text_color: z.string().optional(),
})

// Create schema for status update
const promotionStatusSchema = z.object({
  id: z.string(),
  active: z.boolean(),
  is_main: z.boolean(),
})

export const promotionsRouter = router({
  getAll: protectedProcedure
    .input(z.object({
      ascending: z.boolean(),
    }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: input.ascending })

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })

      return data as Promotion[]
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('promotions')
        .select('*')
        .eq('id', input)
        .single()

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })

      return data as Promotion
    }),

  create: protectedProcedure
    .input(promotionSchema)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('promotions')
        .insert(input)
        .select()
        .single()

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })

      return data as Promotion
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      promotion: promotionSchema
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('promotions')
        .update(input.promotion)
        .eq('id', input.id)
        .select()
        .single()

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })

      return data as Promotion
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('promotions')
        .delete()
        .eq('id', input)

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message
      })

      return { success: true }
    }),

  bulkUpdateStatus: protectedProcedure
    .input(z.array(promotionStatusSchema))
    .mutation(async ({ ctx, input }) => {
      try {
        // Update each promotion's status individually
        await Promise.all(input.map(async (promotion) => {
          const { error } = await ctx.supabase
            .from('promotions')
            .update({
              active: promotion.active,
              is_main: promotion.is_main
            })
            .eq('id', promotion.id)

          if (error) throw error
        }))

        return { success: true }
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        })
      }
    }),
}) 