import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Promotion } from '@/types/promotion'

export const publicPromotionsService = {
  getAll: async (supabase: SupabaseClient<Database>): Promise<Promotion[]> => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Promotion[]
  }
} 