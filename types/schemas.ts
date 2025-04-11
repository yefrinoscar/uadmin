import { z } from 'zod'


/**
 * Zod schemas for validation
 */

// Client schema
export const clientInfoSchema = z.object({
  name: z.string().min(2, "Name is required"),
  ruc: z.string().min(11, "RUC must be 11 digits"),
  address: z.string().min(5, "Address is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

// Proforma items schema
export const proformaItemSchema = z.object({
  description: z.string().min(2, "Description is required"),
  notes: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Price must be positive"),
  warranty_months: z.number().optional(),
  total: z.number(),
})

// Conditions schema
export const conditionsSchema = z.object({
  includeIGV: z.boolean(),
  validityPeriodDays: z.number().min(1),
  deliveryTime: z.string().min(1),
  paymentMethod: z.string().min(1),
})

// Complete proforma schema
export const proformaSchema = z.object({
  number: z.string(),
  date: z.string(),
  due_date: z.string(),
  currency: z.enum(['USD', 'PEN']),
  exchange_rate: z.number().min(0),
  client_id: z.string(),
  items: z.array(proformaItemSchema),
  conditions: conditionsSchema,
  seller_id: z.string(),
  subtotal: z.number(),
  tax: z.number(),
  total: z.number(),
  status: z.enum(['draft', 'sent', 'approved', 'rejected']),
  notes: z.string().optional(),
  include_igv: z.boolean(),
  validity_period_days: z.number().min(1),
  delivery_time: z.string().min(1),
  payment_method: z.string().min(1),
  warranty_months: z.number().optional(),
})

// Create client input schema (for client creation only)
export const createClientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  ruc: z.string().min(11, "RUC must be 11 digits"),
  address: z.string().min(5, "Address is required"),
  contact_person: z.string().min(2, "Contact person is required"),
  phone: z.string().optional(),
  email: z.string().email().optional()
})

// Type exports - use these for type inference
export type ClientInfoSchema = z.infer<typeof clientInfoSchema>
export type ProformaItemSchema = z.infer<typeof proformaItemSchema>
export type ConditionsSchema = z.infer<typeof conditionsSchema>
export type ProformaSchema = z.infer<typeof proformaSchema>
export type CreateClientSchema = z.infer<typeof createClientSchema> 