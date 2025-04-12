import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { Proforma } from '@/types'
import type { AuthenticatedSupabaseClient } from '@/lib/supabase-client'

// interface DbClient {
//   id: string
//   name: string
//   ruc: string
//   address: string
// }

// interface DbSeller {
//   name: string
//   phone: string
//   email: string
// }

// interface RawProformaData {
//   id: string
//   number: string
//   date: string
//   due_date: string
//   status: string
//   total: number
//   currency: string
//   client: Array<DbClient>
//   seller: Array<DbSeller>
// }

export const proformaService = {
  getById: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient, id: string): Promise<Proforma> => {
    const { data, error } = await supabase
      .from('proformas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Proforma
  },

  // getAll: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient): Promise<Proforma[]> => {
  //   try {
  //     const { data: rawData, error } = await supabase
  //       .from('proforma')
  //       .select(`
  //         id,
  //         number,
  //         date,
  //         due_date,
  //         status,
  //         total,
  //         currency,
  //         client:company_clients!inner(id, name, ruc, address),
  //         seller:users!inner(name, phone, email)
  //       `)
  //       .order('created_at', { ascending: false })

  //     if (error) throw error

  //     // Transform the data to match the Proforma type
  //     const transformedData: Proforma[] = (rawData || []).map((item: RawProformaData) => ({
  //       id: item.id,
  //       status: item.status,
  //       companyInfo: {
  //         ruc: '',
  //         name: 'UNDERLA S.A.C.',
  //         address: 'Av. Garcilaso de la Vega 1261 Tdas 226-227'
  //       },
  //       proformaInfo: {
  //         number: item.number,
  //         date: item.date,
  //         currency: item.currency,
  //         exchangeRate: 1
  //       },
  //       seller: {
  //         name: item.seller?.[0]?.name || '',
  //         phone: item.seller?.[0]?.phone || '',
  //         email: item.seller?.[0]?.email || ''
  //       },
  //       client: {
  //         id: item.client?.[0]?.id || '',
  //         name: item.client?.[0]?.name || '',
  //         address: item.client?.[0]?.address || '',
  //         ruc: item.client?.[0]?.ruc || '',
  //         contactPerson: ''
  //       },
  //       conditions: {
  //         includeIGV: true,
  //         validityPeriodDays: 30,
  //         deliveryTime: 'Inmediata',
  //         paymentMethod: 'CONTADO'
  //       },
  //       items: [],
  //       totalAmount: item.total || 0
  //     }))

  //     return transformedData
  //   } catch (error) {
  //     console.error('Error fetching proformas:', error)
  //     throw error
  //   }
  // },

  create: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient, proforma: Proforma): Promise<Proforma> => {
    const { data, error } = await supabase
      .from('proformas')
      .insert(proforma)
      .select()
      .single()

    if (error) throw error
    return data as Proforma
  },

  update: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient, id: string, proforma: Partial<Proforma>): Promise<Proforma> => {
    const { data, error } = await supabase
      .from('proformas')
      .update(proforma)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Proforma
  },

  delete: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient, id: string): Promise<void> => {
    const { error } = await supabase
      .from('proformas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  generateNumber: async (supabase: SupabaseClient<Database> | AuthenticatedSupabaseClient): Promise<string> => {
    try {
      const currentYear = new Date().getFullYear()
      
      const { count, error } = await supabase
        .from('proforma')
        .select('*', { count: 'exact', head: true })
        .gte('date', `${currentYear}-01-01`)
        .lte('date', `${currentYear}-12-31`)

      if (error) throw error

      // Format: PRF-2024-0001
      const number = `PRF-${currentYear}-${String((count || 0) + 1).padStart(4, '0')}`
      return number
    } catch (error) {
      console.error('Error generating proforma number:', error)
      throw error
    }
  }
} 