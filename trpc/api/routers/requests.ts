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

const FiltersSchema = z.object({
  status: z.enum(["pending", "in_progress", "in_transit", "completed", "cancelled", "delivered"]).nullable(),
  clientId: z.string().nullable(),
  text: z.string().nullable()
});

const PaginationInputSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(10),
  filters: FiltersSchema.optional()
});


const ClientSchema = z.object({
  email: z.string().email().nullable(),
  phone_number: z.string().nullable(),
  name: z.string().optional().nullable(),
});

const AssignedUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});

const ClientFilterItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email().nullable(),
});

export const ProductSchema = z.object({
  id: z.string(),
  request_id: z.string().optional(),
  title: z.string(),
  base_price: z.number().nullable().optional(),
  profit_amount: z.number().nullable().optional(),
  price: z.number(),
  tax: z.number().nullable().optional(), // Percentage
  weight: z.number(),
  source: z.string(),
  description: z.string().nullable(),
  image_url: z.string().nullable(),
  imageData: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

const PurchaseRequestSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(["pending", "in_progress", "in_transit", "completed", "cancelled", "delivered"]).nullable(),
  response: z.string().optional().nullable(),
  url: z.string().url().optional().nullable(),
  sub_total: z.number().optional().nullable().default(0),
  weight: z.number().optional().nullable().default(0),
  profit: z.number().optional().nullable().default(0),
  productsProfit: z.number().optional().nullable().default(0),
  totalProfit: z.number().optional().nullable().default(0),
  shipping_cost: z.number().optional().nullable(),
  price: z.number().optional().nullable(),
  final_price: z.number().optional().nullable(),
  exchange_rate: z.number().optional(),
  currency: z.string().optional().nullable(),
  email_sent: z.boolean().optional().nullable(),
  whatsapp_sent: z.boolean().optional().nullable(),
  assigned_user: AssignedUserSchema.nullable(),
  client: ClientSchema.nullable(),
  products: z.array(ProductSchema),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

const PurchaseRequestListSchema = z.object({
  id: z.string(),
  description: z.string(),
  client: ClientSchema.nullable(),
  assigned_user: AssignedUserSchema.nullable(),
  status: z.enum(["pending", "in_progress", "in_transit", "completed", "cancelled", "delivered"]).nullable(),
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
  phone_number: z.string().optional(),
  name: z.string().optional(),
  user_id: z.string().optional(),
}).refine((data) => {
  // At least phone or name must be provided
  return data.phone_number || data.email;
}, {
  message: "Either phone or email must be provided"
});

function formatEmailContent(content: string): string {
  return content
    .replace(/\n/g, '<br>')
    .replace(/ {2,}/g, match => '&nbsp;'.repeat(match.length));
}
export type PurchaseRequest = z.infer<typeof PurchaseRequestSchema>
export type PurchaseRequestList = Omit<PurchaseRequest, 'products' | 'sub_total' | 'weight' | 'profit'>

export type RequestFilter = z.infer<typeof FiltersSchema>


export type Client = z.infer<typeof ClientSchema>
export type Product = z.infer<typeof ProductSchema>

export const requestsRouter = router({
  getAll: protectedProcedure
    .input(PaginationInputSchema)
    .output(z.object({
      items: z.array(PurchaseRequestListSchema),
      totalCount: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, pageSize, filters } = input;
      const { status, clientId, text } = filters || {};
      const offset = (page - 1) * pageSize

      let query = ctx.supabase
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
        `, { count: 'exact' }) // Request total count for filtered query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      console.log('status', status);

      if (status) {
        query = query.eq('status', status);
      }

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      if (text) {
        query = query.or(`description.ilike.%${text}%`);
      }


      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching requests:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch purchase requests' });
      }

      const formattedData = data.map(item => {
        let clientData = null;
        // Check if client exists and handle array/object/null cases
        if (Array.isArray(item.client)) {
          clientData = item.client.length > 0 ? item.client[0] : null;
        } else if (item.client) {
          clientData = item.client;
        }

        let assignedUserData = null;
        if (Array.isArray(item.assigned_user)) {
          assignedUserData = item.assigned_user.length > 0 ? item.assigned_user[0] : null;
        } else if (item.assigned_user) {
          assignedUserData = item.assigned_user;
        }

        return {
          ...item,
          client: clientData ? {
            email: clientData.email ?? null,
            phone_number: clientData.phone_number ?? null,
            name: clientData.name ?? null,
          } : null,
          assigned_user: assignedUserData ? {
            id: assignedUserData.id,
            name: assignedUserData.name ?? null,
          } : null,
          created_at: item.created_at,
          updated_at: item.updated_at,
          price: item.price,
          response: item.response,
          url: item.url,
          email_sent: item.email_sent,
          whatsapp_sent: item.whatsapp_sent,
        };
      }).filter(Boolean) as PurchaseRequestList[];

      return {
        items: formattedData,
        totalCount: count ?? 0,
      };
    }),

  getClientsForFilter: protectedProcedure
    .output(z.array(ClientFilterItemSchema))
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from('clients')
        .select('id, name, email')
        .order('name', { ascending: true });

      if (error) {
        console.error("Error fetching clients for filter:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch clients' });
      }
      return data.map(client => ({
        id: client.id,
        name: client.name,
        email: client.email
      }));
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
          final_price,
          exchange_rate,
          currency,
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


      const validationResult = PurchaseRequestSchema.safeParse(formattedData);
      if (!validationResult.success) {
        // Combine error messages for a clearer response
        const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        console.log("errorMessages", errorMessages);
      }

      console.log("validationResult", validationResult);

      return formattedData;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["pending", "in_progress", "in_transit", "completed", "cancelled", "delivered"]),
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

  getUsers: protectedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from("users")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error fetching users:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch users' });
      }

      return data;
    }),

  updateAssignedUser: protectedProcedure
    .input(z.object({
      requestId: z.string(),
      userId: z.string().nullable()
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("purchase_requests")
        .update({
          assigned_user: input.userId ? input.userId : null,
          updated_at: new Date().toISOString()
        })
        .eq("id", input.requestId);

      if (error) {
        console.error("Error updating assigned user:", error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to update assigned user' });
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
                    Keep the email concise and friendly. Do not include specific percentages or breakdowns of the costs. Write it in Spanish. 
                    Do not include a signature. Make sure the email ends with a period. 
                    Make sure to tell client 50% is for advance payment and 50% is for delivery. tel client is just for release of store only this promotion of 50/50, make sure to write it in uppercase and exclamations.
                    Tell client that they can pay with bank transfer or credit card with a fee of 5% of the total price.
                    `;

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
      finalPrice: z.number().optional(),
      profit: z.number().optional(),
      response: z.string().optional(),
      currency: z.string().optional(),
      exchangeRate: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, price, finalPrice, profit, response, currency, exchangeRate } = input;

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
        
        if (finalPrice !== undefined) {
          updateData.final_price = finalPrice;
        }

        if (currency !== undefined) {
          updateData.currency = currency;
        }

        if (exchangeRate !== undefined) {
          updateData.exchange_rate = exchangeRate;
        }

        if (profit !== undefined) {
          updateData.profit = profit;
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
      product: ProductSchema
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
              base_price: processedProduct.base_price,
              profit_amount: processedProduct.profit_amount,
              tax: processedProduct.tax,
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
              base_price: processedProduct.base_price || processedProduct.price,
              price: processedProduct.price,
              profit_amount: processedProduct.profit_amount || 0,
              tax: processedProduct.tax,
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

        console.log(startDate, endDate);
        

        // Build query for all requests
        let requestsQuery = ctx.supabase
          .from('purchase_requests')
          .select('id, status, price, created_at', { count: 'exact' });
        
        // Apply date filter if period is not 'all'
        if (input.period !== 'all' && startDate && endDate) {
          requestsQuery = requestsQuery.gte('created_at', startDate).lte('created_at', endDate);
        }
        
        const { data: requestsData, error: requestsError, count: totalRequests } = await requestsQuery;
        
        if (requestsError) throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: requestsError.message
        });

        // Get completed requests (delivered or completed status)
        let completedRequestsQuery = ctx.supabase
          .from('purchase_requests')
          .select('id', { count: 'exact' })
          .in('status', ['delivered', 'completed']);
        
        // Apply date filter if period is not 'all'
        if (input.period !== 'all' && startDate && endDate) {
          completedRequestsQuery = completedRequestsQuery.gte('created_at', startDate).lte('created_at', endDate);
        }
        
        const { count: completedRequests, error: completedError } = await completedRequestsQuery;
        
        if (completedError) throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: completedError.message
        });

        // Get all products with profit data
        let productsQuery = ctx.supabase
          .from('request_products')
          .select('request_id, title, price, base_price, profit_amount');
          
        if (input.period !== 'all' && startDate && endDate) {
          productsQuery = productsQuery.gte('created_at', startDate).lte('created_at', endDate);
        }
        
        const { data: productsData, error: productsError } = await productsQuery;
        
        if (productsError) throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: productsError.message
        });

        // Calculate total profits
        const totalProfit = productsData
          ? productsData.reduce((sum, product) => sum + (product.profit_amount || 0), 0)
          : 0;

        // Calculate average profit per request
        const avgProfitPerRequest = completedRequests && completedRequests > 0
          ? totalProfit / completedRequests
          : 0;

        // Calculate conversion rate (completed / total)
        const conversionRate = totalRequests && totalRequests > 0
          ? (completedRequests || 0) / totalRequests
          : 0;

        // Get top products by frequency
        const productFrequency: Record<string, { count: number, profit: number }> = {};
        
        if (productsData) {
          productsData.forEach(product => {
            const title = product.title;
            if (!productFrequency[title]) {
              productFrequency[title] = { count: 0, profit: 0 };
            }
            productFrequency[title].count += 1;
            productFrequency[title].profit += (product.profit_amount || 0);
          });
        }
        
        // Sort by count and get top 5
        const topProducts = Object.entries(productFrequency)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([title, stats]) => ({
            title,
            count: stats.count,
            profit: stats.profit
          }));

        return {
          totalRequests: totalRequests || 0,
          completedRequests: completedRequests || 0,
          totalProfit,
          avgProfitPerRequest,
          conversionRate,
          topProducts,
          period: input.period
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        });
      }
    }),

  getTimeSeriesStats: protectedProcedure
    .input(z.object({
      period: z.enum(["current_month", "last_month", "current_year", "all"]).default("current_month")
    }))
    .query(async ({ ctx, input }) => {
      try {
        const now = new Date();
        let startDate, endDate, groupFormat, dateFormat;
        
        // Set date range and format based on period
        if (input.period === 'current_month' || input.period === 'last_month') {
          // Daily data for a month
          if (input.period === 'current_month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
          } else {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
          }
          
          groupFormat = 'DD'; // Day format for grouping
          dateFormat = 'DD'; // Display as day number
        } else if (input.period === 'current_year') {
          // Monthly data for a year
          startDate = new Date(now.getFullYear(), 0, 1).toISOString();
          endDate = new Date(now.getFullYear(), 11, 31).toISOString();
          
          groupFormat = 'MM'; // Month format for grouping
          dateFormat = 'Mon'; // Display as month name abbreviation
        } else {
          // Yearly data for all time
          startDate = null;
          endDate = null;
          
          groupFormat = 'YYYY'; // Year format for grouping
          dateFormat = 'YYYY'; // Display as year
        }

        // Get all requests grouped by time
        let requestsQuery = ctx.supabase
          .from('purchase_requests')
          .select('id, status, created_at');
          
        if (startDate && endDate) {
          requestsQuery = requestsQuery.gte('created_at', startDate).lte('created_at', endDate);
        }
        
        const { data: requestsData, error: requestsError } = await requestsQuery;
        
        if (requestsError) throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: requestsError.message
        });
        
        // Get products data for profit calculation
        let productsQuery = ctx.supabase
          .from('request_products')
          .select('request_id, profit_amount, created_at');
          
        if (startDate && endDate) {
          productsQuery = productsQuery.gte('created_at', startDate).lte('created_at', endDate);
        }
        
        const { data: productsData, error: productsError } = await productsQuery;
        
        if (productsError) throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: productsError.message
        });

        // Function to format date based on period
        const formatDate = (dateStr: string): string => {
          const date = new Date(dateStr);
          if (input.period === 'current_month' || input.period === 'last_month') {
            return date.getDate().toString().padStart(2, '0'); // DD
          } else if (input.period === 'current_year') {
            const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            return monthNames[date.getMonth()]; // Month abbreviation
          } else {
            return date.getFullYear().toString(); // YYYY
          }
        };

        // Group requests by date
        const timeSeriesData: Record<string, { date: string, requests: number, completed: number, profit: number }> = {};
        
        // Prepare the full date range (all days/months/years)
        if (input.period === 'current_month' || input.period === 'last_month') {
          // For month, create entry for each day
          const daysInMonth = new Date(
            input.period === 'current_month' ? now.getFullYear() : now.getFullYear(), 
            input.period === 'current_month' ? now.getMonth() + 1 : now.getMonth(), 
            0
          ).getDate();
          
          for (let i = 1; i <= daysInMonth; i++) {
            const day = i.toString().padStart(2, '0');
            timeSeriesData[day] = { date: day, requests: 0, completed: 0, profit: 0 };
          }
        } else if (input.period === 'current_year') {
          // For year, create entry for each month
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          for (let i = 0; i < 12; i++) {
            timeSeriesData[monthNames[i]] = { date: monthNames[i], requests: 0, completed: 0, profit: 0 };
          }
        } else {
          // For all time, just use the years we have data for
          const years = new Set<string>();
          requestsData?.forEach(request => {
            const year = new Date(request.created_at).getFullYear().toString();
            years.add(year);
          });
          
          years.forEach(year => {
            timeSeriesData[year] = { date: year, requests: 0, completed: 0, profit: 0 };
          });
        }
        
        // Count total requests and completed requests
        requestsData?.forEach(request => {
          const dateKey = formatDate(request.created_at);
          
          if (!timeSeriesData[dateKey]) {
            timeSeriesData[dateKey] = { date: dateKey, requests: 0, completed: 0, profit: 0 };
          }
          
          timeSeriesData[dateKey].requests += 1;
          
          if (request.status === 'completed' || request.status === 'delivered') {
            timeSeriesData[dateKey].completed += 1;
          }
        });
        
        // Calculate profits by date
        productsData?.forEach(product => {
          if (product.created_at && product.profit_amount) {
            const dateKey = formatDate(product.created_at);
            
            if (timeSeriesData[dateKey]) {
              timeSeriesData[dateKey].profit += (product.profit_amount || 0);
            }
          }
        });
        
        // Convert to array and sort by date
        const result = Object.values(timeSeriesData);
        
        // Sort by date
        if (input.period === 'current_month' || input.period === 'last_month') {
          result.sort((a, b) => parseInt(a.date) - parseInt(b.date));
        } else if (input.period === 'current_year') {
          const monthOrder: Record<string, number> = { 
            'Ene': 0, 'Feb': 1, 'Mar': 2, 'Abr': 3, 'May': 4, 'Jun': 5, 
            'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11 
          };
          result.sort((a, b) => monthOrder[a.date] - monthOrder[b.date]);
        } else {
          result.sort((a, b) => parseInt(a.date) - parseInt(b.date));
        }
        
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message
        });
      }
    }),
});

export type RequestsRouter = typeof requestsRouter;