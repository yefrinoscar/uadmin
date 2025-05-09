/**
 * Interface definitions for the proforma system
 */

export interface CompanyInfo {
  name: string
  ruc: string
  address: string
  phone: string
  email: string
}

export interface CompanyClient {
  id: string
  name: string
  ruc: string
  address: string
  contact_person?: string
  phone?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface ClientInfo {
  name: string
  address: string
  ruc: string
  contactPerson: string
  phone?: string
  email?: string
}

export interface ConditionsInfo {
  includeIGV: boolean
  validityPeriodDays: number
  deliveryTime: string
  paymentMethod: string
}

export interface ProformaItem {
  id?: string
  description: string
  notes: string
  unit: string
  quantity: number
  unit_price: number
  total: number
  warranty_months?: number
}

export interface Product {
  id: string
  code: string
  name: string
  description?: string
  unit_price: number
  tax?: number
  warranty_months?: number
  unit?: string
  brand?: string
  category?: string
  created_at: string
  updated_at: string
}

// export interface Proforma {
//   id: string
//   number: string
//   date: string
//   due_date: string
//   client_id: string
//   seller_id: string
//   subtotal: number
//   tax: number
//   total: number
//   status: 'draft' | 'sent' | 'approved' | 'rejected'
//   notes?: string
//   warranty_months: number
//   currency: string
//   exchange_rate: number
//   include_igv: boolean
//   validity_period_days: number
//   delivery_time: string
//   payment_method: string
//   created_at: string
//   updated_at: string
//   items?: ProformaItem[]
//   client?: CompanyClient
//   seller?: {
//     id: string
//     name: string
//     email: string
//     phone: string
//   }
// }


type STATUS = 'draft' | 'sent' | 'approved' | 'rejected'

export interface Proforma {
  id: string
  status: STATUS
  companyInfo: {
    ruc: string
    name: string
    address: string
  }
  proformaInfo: {
    number: string
    date: string
    currency: string
    exchangeRate: number
  }
  seller: {
    name: string
    phone: string
    email: string
  }
  client: {
    id: string
    name: string
    address: string
    ruc: string
    contactPerson: string
  }
  conditions: {
    includeIGV: boolean
    validityPeriodDays: number
    deliveryTime: string
    paymentMethod: string
  }
  items: ProformaItem[]
  totalAmount: number
}

export interface ProformaData {
  id: string
  companyInfo: CompanyInfo
  proformaInfo: {
    number: string
    date: string
    seller: {
      name: string
      phone: string
      email: string
    }
  }
  clientInfo: ClientInfo
  conditions: ConditionsInfo
  items: ProformaItem[]
  totalAmount: number
}