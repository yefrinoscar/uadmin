import { z } from 'zod'
import { router, protectedProcedure } from '@/trpc/init'
import { TRPCError } from '@trpc/server'
import { Promotion, promotionSchema } from '@/lib/schemas/promotion'




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
      console.log(input, 'input');
      
      // Process and upload promotion image if it's a data URL
      let processedPromotion = { ...input };

      if (input.image_url && input.image_url.startsWith('data:image')) {
        // Extract the base64 data
        const base64Data = input.image_url.split(',')[1];
        if (!base64Data) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid image data format'
          });
        }

        // Convert base64 to a Buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Create a unique filename
        const fileExt = input.image_url.split(';')[0].split('/')[1] || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `promotions/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await ctx.supabase.storage
          .from('images')
          .upload(filePath, buffer, {
            contentType: input.image_url.split(';')[0].split(':')[1] || 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to upload promotion image'
          });
        }

        // Get public URL
        const { data: publicUrlData } = ctx.supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        // Update the promotion with the public URL
        processedPromotion = {
          ...input,
          image_url: publicUrlData.publicUrl
        };
      }
      // If image_url doesn't start with 'data:image', it's already a URL - no processing needed

      const { data, error } = await ctx.supabase
        .from('promotions')
        .insert(processedPromotion)
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
      // Process and upload promotion image if it's a data URL
      console.log(input, 'input');
      
      let processedPromotion = { ...input.promotion };

      if (input.promotion.image_url && input.promotion.image_url.startsWith('data:image')) {
        // Extract the base64 data
        const base64Data = input.promotion.image_url.split(',')[1];
        if (!base64Data) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid image data format'
          });
        }

        // Convert base64 to a Buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Create a unique filename
        const fileExt = input.promotion.image_url.split(';')[0].split('/')[1] || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `promotions/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await ctx.supabase.storage
          .from('images')
          .upload(filePath, buffer, {
            contentType: input.promotion.image_url.split(';')[0].split(':')[1] || 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to upload promotion image'
          });
        }

        // Get public URL
        const { data: publicUrlData } = ctx.supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        // Update the promotion with the public URL
        processedPromotion = {
          ...input.promotion,
          image_url: publicUrlData.publicUrl
        };
      }
      // If image_url doesn't start with 'data:image', it's already a URL - no processing needed

      const { data, error } = await ctx.supabase
        .from('promotions')
        .update(processedPromotion)
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
      // First, get the promotion to check if it has an image to delete
      const { data: promotion, error: fetchError } = await ctx.supabase
        .from('promotions')
        .select('image_url')
        .eq('id', input)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: fetchError.message
        })
      }

      // If promotion has an image, delete it from storage
      if (promotion?.image_url) {
        const fileName = promotion.image_url.split('/').pop();
        if (fileName && promotion.image_url.includes('/promotions/')) {
          const { error: storageError } = await ctx.supabase.storage
            .from('images')
            .remove([`promotions/${fileName}`]);

          if (storageError) {
            console.error("Error deleting promotion image:", storageError);
            // Continue with promotion deletion even if image deletion fails
          }
        }
      }

      // Delete the promotion record
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