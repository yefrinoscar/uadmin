import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Promotion } from '@/types/promotion'
import type { AuthenticatedSupabaseClient } from '@/lib/supabase-client'

export const promotionsService = {
  getAll: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient): Promise<Promotion[]> => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Promotion[]
  },

  getById: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient, id: string): Promise<Promotion> => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Promotion
  },

  create: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient, promotion: Omit<Promotion, 'id'>): Promise<Promotion> => {
    const { data, error } = await supabase
      .from('promotions')
      .insert(promotion)
      .select()
      .single()

    if (error) throw error
    return data as Promotion
  },

  update: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient, id: string, promotion: Partial<Promotion>): Promise<Promotion> => {
    const { data, error } = await supabase
      .from('promotions')
      .update(promotion)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Promotion
  },

  delete: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient, id: string): Promise<void> => {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  bulkUpdate: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient, promotions: Promotion[]): Promise<void> => {
    try {
      const { error } = await supabase
        .from('promotions')
        .upsert(promotions)

      if (error) throw error
    } catch (error) {
      console.error('Error bulk updating promotions:', error)
      throw error
    }
  }
} 