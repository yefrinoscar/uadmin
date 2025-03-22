// Mock data for testing purposes

import type { Promotion } from "@/types/promotion"

// Get current date
const now = new Date()

// Helper function to add days to a date
const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(date.getDate() + days)
  return result
}

export const mockPromotions: Promotion[] = [
  {
    id: "mock-1",
    name: "Descuento en Electrónicos",
    title: "20% de descuento en todos los electrónicos",
    condition_type: "category",
    condition_content: "electronics",
    active: true,
    isMain: true, // Main active promotion
    start_date: now.toISOString(),
    end_date: addDays(now, 7).toISOString(),
    created_at: addDays(now, -1).toISOString(),
    updated_at: now.toISOString(),
    backgroundColor: "#fff"
  },
  {
    id: "mock-2",
    name: "Oferta en Smartphones",
    title: "15% de descuento en smartphones seleccionados",
    condition_type: "tags",
    condition_content: "PHONE-001, PHONE-002, PHONE-003",
    active: false,
    isMain: false,
    start_date: addDays(now, 1).toISOString(),
    end_date: addDays(now, 14).toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    backgroundColor: "#fff"

  },
  {
    id: "mock-3",
    name: "Promoción de Laptops",
    title: "10% de descuento en laptops",
    condition_type: "category",
    condition_content: "laptops",
    active: false,
    isMain: false,
    start_date: addDays(now, -7).toISOString(),
    end_date: addDays(now, -1).toISOString(),
    created_at: addDays(now, -10).toISOString(),
    updated_at: addDays(now, -7).toISOString(),
    backgroundColor: "#fff"

  },
  {
    id: "mock-4",
    name: "Descuento en Accesorios",
    title: "25% de descuento en accesorios",
    condition_type: "category",
    condition_content: "accessories",
    active: true,
    isMain: false, // Secondary active promotion
    start_date: addDays(now, -3).toISOString(),
    end_date: addDays(now, 4).toISOString(),
    created_at: addDays(now, -5).toISOString(),
    updated_at: addDays(now, -3).toISOString(),
    backgroundColor: "#fff"
  },
  {
    id: "mock-5",
    name: "Oferta Flash Gaming",
    title: "30% de descuento en productos gaming",
    condition_type: "category",
    condition_content: "gaming",
    active: false,
    isMain: false,
    start_date: addDays(now, 2).toISOString(),
    end_date: addDays(now, 3).toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    backgroundColor: "#fff"
  }
];
