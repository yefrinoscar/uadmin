export interface CompanyInfo {
  ruc: string
  name: string
  address: string
  district: string
  branch: string
}

export interface InvoiceInfo {
  series: string
  number: string
  issueDate: string
  dueDate: string
  seller: string
  proformaNumber: string
  saleCondition: string
  localType: string
}

export interface ClientInfo {
  name: string
  address: string
  ruc: string
  district: string
  purchaseOrder: string
}

export interface InvoiceItem {
  code: string
  quantity: number
  unit: string
  description: string
  unitPrice: number
  total: number
  warranty: string
}

export interface InvoiceTotals {
  taxableOperations: number
  unaffectedOperations: number
  freeOperations: number
  exemptOperations: number
  exportOperations: number
  igv: number
  totalAmount: number
}

export interface AdditionalInfo {
  amountInWords: string
  hashCode: string
  authorizationText: string
  consultationLink: string
  timestamp: string
}

export interface InvoiceData {
  companyInfo: CompanyInfo
  invoiceInfo: InvoiceInfo
  clientInfo: ClientInfo
  items: InvoiceItem[]
  totals: InvoiceTotals
  additional: AdditionalInfo
}

