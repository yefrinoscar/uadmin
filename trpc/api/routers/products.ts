import { z } from 'zod';
import { protectedProcedure, router } from '../../init';
import { TRPCError } from '@trpc/server';
import { ProductSchema } from './requests';

export const productsRouter = router({
  getAll: protectedProcedure
    .output(z.array(ProductSchema))
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch products' });
      }

      return data;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(ProductSchema.nullable())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("products")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: Row not found, which is okay
        console.error("Error fetching product by ID:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch product' });
      }
      
      return data;
    }),

  create: protectedProcedure
    .input(z.object({
      code: z.string(),
      name: z.string(),
      description: z.string().optional(),
      unit_price: z.number(),
      tax: z.number().optional(),
      warranty_months: z.number().optional(),
      unit: z.string().optional(),
      brand: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("products")
        .insert({
          ...input,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating product:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create product' });
      }

      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      code: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      unit_price: z.number().optional(),
      tax: z.number().optional(),
      warranty_months: z.number().optional(),
      unit: z.string().optional(),
      brand: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await ctx.supabase
        .from("products")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating product:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update product' });
      }

      return data;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("products")
        .delete()
        .eq("id", input.id);

      if (error) {
        console.error("Error deleting product:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to delete product' });
      }

      return { success: true };
    }),
});

export type ProductsRouter = typeof productsRouter; 