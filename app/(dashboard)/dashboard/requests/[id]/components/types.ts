export type PurchaseRequest = {
  id: string
  description: string
  client: {
    email: string
    phone_number: string
    name?: string
  }
  assigned_user?: {
    id: string
    name: string
  }
  status?: "pending" | "approved" | "rejected"
  created_at?: string
  updated_at?: string
  price?: number
  response?: string
  url?: string
  email_sent?: boolean
  whatsapp_sent?: boolean
}

export type StoreType = 'amazon' | 'ebay' | 'jomashop' | 'fragancex' | 'sephora' | 'jessupbeauty' | 'rarebeauty' | 'beautycreations';