import { ProformaItem } from '@/types/proforma'

export const calculateTotals = (items: ProformaItem[], includeIGV: boolean) => {
  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0)
  const tax = includeIGV ? subtotal * 0.18 : 0
  const total = subtotal + tax

  return {
    subtotal,
    tax,
    total,
  }
} 