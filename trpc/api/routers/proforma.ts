import { z } from 'zod'
import { router as createTRPCRouter, protectedProcedure } from '../../init'
import { 
  proformaSchema, 
  createClientSchema, 
  clientInfoSchema 
} from '@/types/schemas'
import { TRPCError } from '@trpc/server'

export const proformaRouter = createTRPCRouter({
  getClients: protectedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from('company_clients')
        .select('*')
        .order('name')

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      return data
    }),

  createClient: protectedProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, userId } = ctx
      
      const { data, error } = await supabase
        .from('company_clients')
        .insert({
          ...input
        })
        .select()
        .single()
      
      if (error) {
        if (error.code === '23505') {
          throw new TRPCError({ 
            code: 'CONFLICT', 
            message: 'A client with this RUC already exists' 
          })
        }
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error.message 
        })
      }
      
      return data
    }),

  create: protectedProcedure
    .input(proformaSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx

      // Generate proforma number
      const { data: lastProforma } = await supabase
        .from('proformas')
        .select('number')
        .order('created_at', { ascending: false })
        .limit(1)

      // Function to generate a new proforma number
      const generateProformaNumber = (lastNumber: string | undefined) => {
        if (!lastNumber) return 'PF-0001';
        
        const numPart = lastNumber.split('-')[1];
        const nextNum = parseInt(numPart, 10) + 1;
        return `PF-${nextNum.toString().padStart(4, '0')}`;
      }

      const newNumber = generateProformaNumber(lastProforma?.[0]?.number)

      // Insert proforma
      const { data: proforma, error } = await supabase
        .from('proformas')
        .insert({
          ...input,
          number: newNumber,
          created_by: ctx.userId,
        })
        .select()
        .single()

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })

      // Insert items
      const { error: itemsError } = await supabase
        .from('proforma_items')
        .insert(
          input.items.map(item => ({
            ...item,
            proforma_id: proforma.id
          }))
        )

      if (itemsError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: itemsError.message })

      return proforma
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('proformas')
        .select(`
          *,
          items:proforma_items(*),
          client:clients(*),
          seller:profiles(*)
        `)
        .eq('id', input)
        .single()

      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: 'Proforma not found' })
      return data
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['draft', 'sent', 'approved', 'rejected'])
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('proformas')
        .update({ status: input.status })
        .eq('id', input.id)
        .select()
        .single()

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      return data
    })
}) 