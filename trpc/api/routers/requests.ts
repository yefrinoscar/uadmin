import { z } from 'zod';
import { protectedProcedure, router } from '../../init';
import { TRPCError } from '@trpc/server';
import { OpenAI } from "openai";
import { Resend } from 'resend';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@dashboard.underla.lat';

function formatEmailContent(content: string): string {
  return content
    .replace(/\n/g, '<br>')
    .replace(/ {2,}/g, match => '&nbsp;'.repeat(match.length));
}

// Define Zod schemas for validation
const ClientSchema = z.object({
  email: z.string().email().nullable(),
  phone_number: z.string().nullable(),
  name: z.string().optional().nullable(),
});

const AssignedUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});

export const ProductSchema = z.object({
  id: z.string(),
  request_id: z.string(),
  title: z.string(),
  price: z.number(),
  weight: z.number(),
  source: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  imageData: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional()
});

const PurchaseRequestSchema = z.object({
  id: z.string(),
  description: z.string(),
  client: ClientSchema.nullable(),
  assigned_user: AssignedUserSchema.nullable(),
  status: z.enum(["pending", "approved", "rejected"]).nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  price: z.number().optional().nullable(),
  response: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  email_sent: z.boolean().optional().nullable(),
  whatsapp_sent: z.boolean().optional().nullable(),
  products: z.array(ProductSchema),
});

const PurchaseRequestListSchema = z.object({
  id: z.string(),
  description: z.string(),
  client: ClientSchema.nullable(),
  assigned_user: AssignedUserSchema.nullable(),
  status: z.enum(["pending", "approved", "rejected"]).nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  price: z.number().optional().nullable(),
  response: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  email_sent: z.boolean().optional().nullable(),
  whatsapp_sent: z.boolean().optional().nullable()
});

const CreateRequestSchema = z.object({
  description: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
}).refine((data) => {
  // At least phone or name must be provided
  return data.phone || data.name;
}, {
  message: "Either phone or name must be provided"
});

export type PurchaseRequest = z.infer<typeof PurchaseRequestSchema>
export type PurchaseRequestList = Omit<PurchaseRequest, 'products'>

export type Client = z.infer<typeof ClientSchema>
export type Product = z.infer<typeof ProductSchema>


export const requestsRouter = router({
  getAll: protectedProcedure
    .output(z.array(PurchaseRequestListSchema))
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("purchase_requests")
        .select(`
          id,
          description,
          price,
          status,
          response,
          created_at,
          updated_at,
          client:clients(email, phone_number, name),
          assigned_user:users(id, name),
          url,
          email_sent,
          whatsapp_sent
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching requests:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch purchase requests' });
      }

      // Supabase might return single objects, arrays, or null for relationships. Normalize them.
      const formattedData = data.map(item => {
        let clientData = null;
        // Check if client exists and handle array/object/null cases
        if (item.client) {
          clientData = Array.isArray(item.client)
            ? (item.client.length > 0 ? item.client[0] : null) // Handle empty array
            : item.client; // Handle single object
        }

        let assignedUserData = null;
        // Check if assigned_user exists and handle array/object/null cases
        if (item.assigned_user) {
          assignedUserData = Array.isArray(item.assigned_user)
            ? (item.assigned_user.length > 0 ? item.assigned_user[0] : null) // Handle empty array
            : item.assigned_user; // Handle single object
        }

        return {
          ...item,
          client: clientData,
          assigned_user: assignedUserData
        };
      });

      return formattedData;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .output(PurchaseRequestSchema.nullable())
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("purchase_requests")
        .select(`
          id,
          description,
          price,
          status,
          response,
          created_at,
          updated_at,
          client:clients(email, phone_number, name),
          assigned_user:users(id, name),
          url,
          email_sent,
          whatsapp_sent
        `)
        .eq("id", input.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116: Row not found, which is okay
        console.error("Error fetching request by ID:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch purchase request' });
      }
      if (!data) return null;

      // Get associated products
      const { data: productsData, error: productsError } = await ctx.supabase
        .from("request_products")
        .select("*")
        .eq("request_id", input.id);

      if (productsError) {
        console.error("Error fetching request products:", productsError);
        // Don't throw here, just continue without products
      }

      const formattedData = {
        ...data,
        client: Array.isArray(data.client) ? data.client[0] : data.client,
        assigned_user: Array.isArray(data.assigned_user) ? data.assigned_user[0] : data.assigned_user,
        products: productsData || []
      };

      return formattedData;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["pending", "approved", "rejected"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("purchase_requests")
        .update({
          status: input.status,
          updated_at: new Date().toISOString()
        })
        .eq("id", input.id);

      if (error) {
        console.error("Error updating status:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update status' });
      }
      return { success: true };
    }),

  updateResponse: protectedProcedure
    .input(z.object({
      id: z.string(),
      response: z.string(),
      price: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("purchase_requests")
        .update({
          response: input.response,
          price: input.price,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id);

      if (error) {
        console.error("Error updating response:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update response' });
      }
      return { success: true };
    }),

  updateWhatsappSent: protectedProcedure
    .input(z.object({ id: z.string(), sent: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("purchase_requests")
        .update({
          whatsapp_sent: input.sent,
          updated_at: new Date().toISOString()
        })
        .eq("id", input.id);

      if (error) {
        console.error("Error updating WhatsApp sent status:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update WhatsApp sent status' });
      }
      return { success: true };
    }),

  generateEmailText: protectedProcedure
    .input(z.object({
      clientName: z.string(),
      totalUSD: z.number(),
      totalPEN: z.number()
    }))
    .mutation(async ({ input }) => {
      const prompt = `Generate a professional email response for a purchase request quotation. 
                    Address the client as "${input.clientName}". The final price is $ ${input.totalUSD.toFixed(2)} or S/. ${input.totalPEN.toFixed(2)}. 
                    Explain the quotation briefly in simple terms for an average person. Mention that after the product arrives to Miami, 
                    it will take a maximum of 7 days to reach the customer. 
                    Keep the email concise and friendly. Do not include specific percentages or breakdowns of the costs. Write it in Spanish. Do not include a signature. Make sure the email ends with a period.`;
      
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        });

        const email = completion.choices[0].message?.content?.trim();
        
        if (!email) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Failed to generate email content' 
          });
        }
        
        return { email };
      } catch (error) {
        console.error("OpenAI API error:", error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: 'Failed to generate email' 
        });
      }
    }),

  sendEmail: protectedProcedure
    .input(z.object({
      id: z.string(),
      email: z.string().email(),
      subject: z.string(),
      content: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!input.email || !input.subject || !input.content) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Missing required fields' 
          });
        }

        const formattedContent = formatEmailContent(input.content);

        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: input.email,
          subject: input.subject,
          html: formattedContent,
        });

        if (error) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Resend API error: ${error.message}` 
          });
        }

        // Update email_sent status in the database
        const { error: updateError } = await ctx.supabase
          .from("purchase_requests")
          .update({
            email_sent: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", input.id);

        if (updateError) {
          console.error("Error updating email sent status:", updateError);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Failed to update email sent status' 
          });
        }

        return { success: true, data };
      } catch (error) {
        console.error('Error sending email:', error);
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to send email' 
        });
      }
    }),

  updateRequest: protectedProcedure
    .input(z.object({
      id: z.string(),
      price: z.number().optional(),
      response: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, price, response } = input;
        
        // First, let's check if the request exists
        const { data: existingRequest, error: findError } = await ctx.supabase
          .from("purchase_requests")
          .select("id")
          .eq("id", id)
          .single();
  
        if (findError) {
          console.error("Error finding purchase request:", findError);
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Purchase request not found' });
        }
        
        // Update the request with price and response
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (price !== undefined) {
          updateData.price = price;
        }
        
        if (response !== undefined) {
          updateData.response = response;
        }
        
        const { error: updateError } = await ctx.supabase
          .from("purchase_requests")
          .update(updateData)
          .eq("id", id);
        
        if (updateError) {
          console.error("Error updating request:", updateError);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Failed to update request' 
          });
        }
        
        return { 
          success: true
        };
      } catch (error) {
        console.error("Error in updateRequest:", error);
        throw error instanceof TRPCError 
          ? error 
          : new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'An unexpected error occurred'
            });
      }
    }),

  updateProduct: protectedProcedure
    .input(z.object({
      requestId: z.string(),
      product: ProductSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { requestId, product } = input;
        let newProduct = false;
        
        // First, check if the request exists
        const { data: existingRequest, error: findError } = await ctx.supabase
          .from("purchase_requests")
          .select("id")
          .eq("id", requestId)
          .single();
  
        if (findError) {
          console.error("Error finding purchase request:", findError);
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Purchase request not found' });
        }

        // Process and upload product image if it's a data URL
        let processedProduct = { ...product };
        
        if (product.imageData && product.imageData.startsWith('data:image')) {
          // Extract the base64 data
          const base64Data = product.imageData.split(',')[1];
          if (!base64Data) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: 'Invalid image data format' 
            });
          }

          // Convert base64 to a Buffer
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Create a unique filename
          const fileExt = product.imageData.split(';')[0].split('/')[1] || 'jpg';
          const fileName = `${product.id}.${fileExt}`;
          const filePath = `products/${fileName}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await ctx.supabase.storage
            .from('images')
            .upload(filePath, buffer, {
              contentType: product.imageData.split(';')[0].split(':')[1] || 'image/jpeg',
              upsert: true
            });
          
          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'Failed to upload product image' 
            });
          }
          
          // Get public URL
          const { data: publicUrlData } = ctx.supabase.storage
            .from('images')
            .getPublicUrl(filePath);
          
          // Update the product with the public URL
          processedProduct = {
            ...product,
            image_url: publicUrlData.publicUrl
          };
        }
        
        // Check if the product exists
        const { data: existingProduct, error: findProductError } = await ctx.supabase
          .from("request_products")
          .select("id")
          .eq("request_id", requestId)
          .eq("id", product.id)
          .single();
        
        if (findProductError && findProductError.code !== 'PGRST116') { // Not found is OK
          console.error("Error checking for existing product:", findProductError);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Failed to check for existing product' 
          });
        }
        
        if (existingProduct) {
          // Update existing product
          const { error: updateError } = await ctx.supabase
            .from("request_products")
            .update({
              title: processedProduct.title,
              price: processedProduct.price,
              weight: processedProduct.weight,
              description: processedProduct.description || '',
              source: processedProduct.source,
              image_url: processedProduct.image_url || null,
              updated_at: new Date().toISOString()
            })
            .eq("request_id", requestId)
            .eq("id", product.id);
            
          if (updateError) {
            console.error("Error updating product:", updateError);
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'Failed to update product' 
            });
          }
        } else {
          newProduct = true;
          // Insert new product
          const { error: insertError } = await ctx.supabase
            .from("request_products")
            .insert({
              request_id: requestId,
              title: processedProduct.title,
              price: processedProduct.price,
              weight: processedProduct.weight,
              description: processedProduct.description || '',
              source: processedProduct.source,
              image_url: processedProduct.image_url || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error("Error inserting product:", insertError);
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'Failed to insert product' 
            });
          }
        }
        
        return { 
          success: true, 
          product: processedProduct,
          newProduct
        };
      } catch (error) {
        console.error("Error in updateSingleProduct:", error);
        throw error instanceof TRPCError 
          ? error 
          : new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'An unexpected error occurred'
            });
      }
    }),
    
  deleteSingleProduct: protectedProcedure
    .input(z.object({
      requestId: z.string(),
      id: z.string(),
      image_url: z.string().nullable()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { requestId, id, image_url } = input;
    
        // If product has an image, delete it from storage
        if (image_url) {          
          const fileName = image_url.split('/').pop();

          if (fileName) {
            const { data, error: storageError } = await ctx.supabase.storage
              .from('images')
              .remove([`products/${fileName}`]);
              
            if (storageError) {
              console.error("Error deleting image:", storageError);
              // Continue with product deletion even if image deletion fails
            }
          }
        }
        
        // Delete the product record
        const { data, error: deleteError } = await ctx.supabase
          .from("request_products")
          .delete()
          .eq("request_id", requestId)
          .eq("id", id);          
          
        if (deleteError) {
          console.error("Error deleting product:", deleteError);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Failed to delete product' 
          });
        }
        
        return { success: true };
      } catch (error) {
        console.error("Error in deleteSingleProduct:", error);
        throw error instanceof TRPCError 
          ? error 
          : new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'An unexpected error occurred'
            });
      }
    }),

  create: protectedProcedure
    .input(CreateRequestSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: error.message || 'Failed to create request' 
          });
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error in create request:", error);
        throw error instanceof TRPCError 
          ? error 
          : new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: 'Failed to create request' 
            });
      }
    }),
});

export type RequestsRouter = typeof requestsRouter;