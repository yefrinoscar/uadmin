import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'
import { useMemo } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface AuthenticatedSupabaseClient extends SupabaseClient {
  isAuthenticated: boolean;
}

// Create authenticated Supabase client with proper typing
export function createAuthenticatedClient(token?: string): AuthenticatedSupabaseClient {
  const client = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {}
    }
  });

  return Object.assign(client, { isAuthenticated: !!token }) as AuthenticatedSupabaseClient;
}

// Custom hook for Supabase client with auth state management
export function useSupabaseClient() {
  const { getToken } = useAuth();
  
  // Memoize the async function to get authenticated client
  const getAuthenticatedClient = useMemo(() => {
    return async (): Promise<AuthenticatedSupabaseClient> => {
      try {
        const token = await getToken({ template: 'supabase' });
        return createAuthenticatedClient(token || undefined);
      } catch (error) {
        console.error('Failed to get auth token:', error);
        // Return unauthenticated client as fallback
        return createAuthenticatedClient();
      }
    };
  }, [getToken]);

  return {
    getAuthenticatedClient,
  };
}

// Export a default unauthenticated client for public routes
export const supabase = createAuthenticatedClient();

