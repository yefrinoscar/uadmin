import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { cache } from 'react'

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */

// { req }): FetchCreateContextFnOptions
export const createTRPCContext = cache(async() => {
  // Get auth session from clerk
  const { userId, getToken } = await auth()
  
  // Get JWT token for Supabase
  let supabaseAccessToken: string | undefined
  
  if (userId) {
    try {
      // @ts-ignore - getToken exists but might not be in type definitions
      supabaseAccessToken = await getToken({ template: 'supabase' })
    } catch (error) {
      console.error('Error getting Supabase token:', error)
    }
  }
  
  // Create Supabase client with auth header if token available
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: supabaseAccessToken ? `Bearer ${supabaseAccessToken}` : '',
        },
      },
    }
  )

  return {
    supabase,
    userId,
  }
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>> 