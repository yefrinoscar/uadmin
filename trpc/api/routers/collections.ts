import { z } from 'zod';
import { protectedProcedure, router } from '../../init';
import { TRPCError } from '@trpc/server';
import { randomUUID } from 'crypto';

// Collection schema
export const collectionSchema = z.object({
  id: z.string().uuid().optional(),
  shopify_id: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  sort_order: z.number().default(0),
  published: z.boolean().default(true),
  shopify_data: z.any().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  synced_at: z.string().optional(),
});

export type Collection = z.infer<typeof collectionSchema>;

// Shopify GraphQL API helper function
async function fetchShopifyCollections() {
  const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopifyDomain || !shopifyAccessToken) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Shopify credentials not configured. Please set SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN environment variables.',
    });
  }

  // GraphQL query to fetch collections
  const query = `
    query GetCollections($first: Int!, $after: String) {
      collections(first: $first, after: $after) {
        edges {
          node {
            id
            handle
            title
            description
            descriptionHtml
            resourcePublications(first: 10) {
              edges {
                node {
                  publication {
                    id
                    name
                  }
                  isPublished
                }
              }
            }
            image {
              url
              altText
            }
            updatedAt
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    let allCollections: any[] = [];
    let hasNextPage: boolean = true;
    let cursor: string | null = null;

    // Paginate through all collections
    while (hasNextPage) {
      const response: Response = await fetch(
        `https://${shopifyDomain}/admin/api/2025-01/graphql.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': shopifyAccessToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: {
              first: 200, // Fetch 50 collections per request
              after: cursor,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      console.log(result);
      

      if (result.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }

      const collections = result.data?.collections;
      if (!collections) {
        throw new Error('No collections data in response');
      }

      // Extract collection nodes
      const nodes = collections.edges.map((edge: any) => {
        // Check if published in Hydrogen channel
        const publications = edge.node.resourcePublications?.edges || [];
        const isPublishedInHydrogen = publications.some((pub: any) => 
          pub.node.isPublished && pub.node.publication.name.toLowerCase().includes('underla'));        
        
        return {
          id: edge.node.id.replace('gid://shopify/Collection/', ''), // Extract numeric ID
          handle: edge.node.handle,
          title: edge.node.title,
          description: edge.node.description,
          descriptionHtml: edge.node.descriptionHtml,
          published: isPublishedInHydrogen,
          image: edge.node.image,
          updatedAt: edge.node.updatedAt,
        };
      });

      allCollections = [...allCollections, ...nodes];

      // Check pagination
      hasNextPage = collections.pageInfo.hasNextPage;
      cursor = collections.pageInfo.endCursor;
    }

    return allCollections;
  } catch (error) {
    console.error('Error fetching from Shopify GraphQL:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch collections from Shopify',
    });
  }
}

export const collectionsRouter = router({
  // Get all collections
  getAll: protectedProcedure
    .input(
      z.object({
        published: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('collections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (input?.published !== undefined) {
        query = query.eq('published', input.published);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching collections:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch collections',
        });
      }

      return data as Collection[];
    }),

  // Get collection by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('collections')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching collection:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch collection',
        });
      }

      return data as Collection | null;
    }),

  // Sync collections from Shopify
  syncFromShopify: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const shopifyCollections = await fetchShopifyCollections();

      // Filter collections: only those without underscore in handle
      const filteredCollections = shopifyCollections.filter(
        (collection: any) => !collection.handle.includes('_')
      );

      const syncedCollections = [];
      const errors = [];

      for (const shopifyCollection of filteredCollections) {
        try {
          // Check if collection already exists
          const { data: existingCollection } = await ctx.supabase
            .from('collections')
            .select('id')
            .eq('shopify_id', shopifyCollection.id.toString())
            .single();

          const collectionData: any = {
            shopify_id: shopifyCollection.id.toString(),
            handle: shopifyCollection.handle,
            title: shopifyCollection.title,
            description: shopifyCollection.description || null,
            image_url: shopifyCollection.image?.url || null,
            published: shopifyCollection.published || false,
            shopify_data: shopifyCollection,
            synced_at: new Date().toISOString(),
          };

          if (existingCollection) {
            // Update existing collection
            const { data, error } = await ctx.supabase
              .from('collections')
              .update({
                ...collectionData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingCollection.id)
              .select()
              .single();

            if (error) {
              errors.push({
                handle: shopifyCollection.handle,
                error: error.message,
              });
            } else {
              syncedCollections.push(data);
            }
          } else {
            // Insert new collection with generated UUID
            const { data, error } = await ctx.supabase
              .from('collections')
              .insert({
                id: randomUUID(),
                ...collectionData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

              console.log('error', error);
              

            if (error) {
              errors.push({
                handle: shopifyCollection.handle,
                error: error.message,
              });
            } else {
              syncedCollections.push(data);
            }
          }
        } catch (error: any) {
          errors.push({
            handle: shopifyCollection.handle,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        synced: syncedCollections.length,
        total: filteredCollections.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error: any) {
      console.error('Error syncing collections:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to sync collections from Shopify',
      });
    }
  }),

  // Update collection (banner/video)
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        banner_url: z.string().optional().nullable(),
        video_url: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Get current collection to check for existing files
      const { data: currentCollection } = await ctx.supabase
        .from('collections')
        .select('banner_url, video_url')
        .eq('id', id)
        .single();

      // Delete old banner file if it exists and we're uploading a new one
      if (currentCollection?.banner_url && updateData.banner_url && updateData.banner_url !== currentCollection.banner_url && currentCollection.banner_url.includes('/collections/')) {
        const fileName = currentCollection.banner_url.split('/').pop();
        if (fileName) {
          await ctx.supabase.storage.from('images').remove([`collections/${fileName}`]);
        }
      }

      // Delete old video file if it exists and we're uploading a new one
      if (currentCollection?.video_url && updateData.video_url && updateData.video_url !== currentCollection.video_url && currentCollection.video_url.includes('/collections/')) {
        const fileName = currentCollection.video_url.split('/').pop();
        if (fileName) {
          await ctx.supabase.storage.from('images').remove([`collections/${fileName}`]);
        }
      }

      // Delete old banner file if we're removing it (setting to null)
      if (currentCollection?.banner_url && updateData.banner_url === null && currentCollection.banner_url.includes('/collections/')) {
        const fileName = currentCollection.banner_url.split('/').pop();
        if (fileName) {
          await ctx.supabase.storage.from('images').remove([`collections/${fileName}`]);
        }
      }

      // Delete old video file if we're removing it (setting to null)
      if (currentCollection?.video_url && updateData.video_url === null && currentCollection.video_url.includes('/collections/')) {
        const fileName = currentCollection.video_url.split('/').pop();
        if (fileName) {
          await ctx.supabase.storage.from('images').remove([`collections/${fileName}`]);
        }
      }

      // Process banner upload if it's a data URL (legacy support)
      let processedData = { ...updateData };

      if (updateData.banner_url && updateData.banner_url.startsWith('data:image')) {
        const base64Data = updateData.banner_url.split(',')[1];
        if (!base64Data) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid banner data format',
          });
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const fileExt = updateData.banner_url.split(';')[0].split('/')[1] || 'jpg';
        const fileName = `banner_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `collections/${fileName}`;

        const { error: uploadError } = await ctx.supabase.storage
          .from('images')
          .upload(filePath, buffer, {
            contentType: updateData.banner_url.split(';')[0].split(':')[1] || 'image/jpeg',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading banner:', uploadError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to upload collection banner',
          });
        }

        const { data: publicUrlData } = ctx.supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        processedData.banner_url = publicUrlData.publicUrl;
      }

      // Process video upload if it's a data URL (legacy support)
      if (updateData.video_url && updateData.video_url.startsWith('data:video')) {
        const base64Data = updateData.video_url.split(',')[1];
        if (!base64Data) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid video data format',
          });
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const fileExt = updateData.video_url.split(';')[0].split('/')[1] || 'mp4';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `collections/${fileName}`;

        const { error: uploadError } = await ctx.supabase.storage
          .from('images')
          .upload(filePath, buffer, {
            contentType: updateData.video_url.split(';')[0].split(':')[1] || 'video/mp4',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading video:', uploadError);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to upload collection video',
          });
        }

        const { data: publicUrlData } = ctx.supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        processedData.video_url = publicUrlData.publicUrl;
      }

      const { data, error } = await ctx.supabase
        .from('collections')
        .update({
          ...processedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating collection:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update collection',
        });
      }

      return data as Collection;
    }),

  // Delete collection
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get collection to check for media files
      const { data: collection } = await ctx.supabase
        .from('collections')
        .select('image_url, video_url')
        .eq('id', input.id)
        .single();

      // Delete media files from storage
      if (collection?.image_url && collection.image_url.includes('/collections/')) {
        const fileName = collection.image_url.split('/').pop();
        if (fileName) {
          await ctx.supabase.storage.from('images').remove([`collections/${fileName}`]);
        }
      }

      if (collection?.video_url && collection.video_url.includes('/collections/')) {
        const fileName = collection.video_url.split('/').pop();
        if (fileName) {
          await ctx.supabase.storage.from('images').remove([`collections/${fileName}`]);
        }
      }

      const { error } = await ctx.supabase
        .from('collections')
        .delete()
        .eq('id', input.id);

      if (error) {
        console.error('Error deleting collection:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete collection',
        });
      }

      return { success: true };
    }),
});

export type CollectionsRouter = typeof collectionsRouter;
