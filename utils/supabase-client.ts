import { createClient } from '@supabase/supabase-js'
import { useAuth, useUser } from '@clerk/nextjs'

/**
 * Utility function to get a Supabase client with authentication 
 * for use in frontend components
 */
export const useSupabaseClient = () => {
  const { getToken } = useAuth()
  const { user } = useUser()
  
  const getAuthenticatedClient = async () => {
    // Get token from Clerk using the Supabase template
    let supabaseAccessToken: string | undefined
    
    if (getToken) {
      try {
        const token = await getToken({ template: 'supabase' })
        supabaseAccessToken = token || undefined
      } catch (error) {
        console.error('Error getting Supabase token:', error)
      }
    }
    
    // Create a new Supabase client with the auth header
    return createClient(
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
  }
  
  return {
    getAuthenticatedClient,
    user,
  }
} 