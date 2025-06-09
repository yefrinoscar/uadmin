import * as z from "zod"

// Client-side schema for forms (uses range_date internally)
export const promotionFormSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "El título es requerido").max(60, "El título debe tener menos de 60 caracteres"),
  description: z.string().min(1, "La descripción es requerida").max(110, "La descripción debe tener menos de 110 caracteres"),
  button_text: z.string().min(1, "El texto del botón es requerido").max(20, "El texto del botón debe tener menos de 20 caracteres"),
  tags: z.string().min(1, "Debes agregar al menos un tag"),
  image_url: z.string().min(1, "Debes subir una imagen de encabezado"), // Can be base64 for new uploads or URL for existing
  sort_order: z.number().default(0),
  active: z.boolean().default(false),
  enabled: z.boolean().default(false),
  range_date: z
  .object({
    from: z.date({
      required_error: "A start date is required.",
    }),
    to: z.date({
      required_error: "An end date is required.",
    }),
  }),
  button_background_color: z.string().min(4).max(9),
  text_color: z.string().min(4).max(9),
})

// Server-side schema (uses start_date/end_date for database)
export const promotionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "El título es requerido").max(60, "El título debe tener menos de 60 caracteres"),
  description: z.string().min(1, "La descripción es requerida").max(110, "La descripción debe tener menos de 110 caracteres"),
  button_text: z.string().min(1, "El texto del botón es requerido").max(20, "El texto del botón debe tener menos de 20 caracteres"),
  tags: z.string().min(1, "Debes agregar al menos un tag"),
  image_url: z.string().min(1, "Debes subir una imagen de encabezado"),
  sort_order: z.number().default(0),
  active: z.boolean().default(false),
  enabled: z.boolean().default(false),
  start_date: z.string(), // ISO string for database
  end_date: z.string(),   // ISO string for database
  button_background_color: z.string().min(4).max(9),
  text_color: z.string().min(4).max(9),
})

export type PromotionForm = z.infer<typeof promotionFormSchema>
export type Promotion = z.infer<typeof promotionSchema>

// Helper function to transform form data to server data
export function transformPromotionForServer(formData: PromotionForm): Promotion {
  const { range_date, ...rest } = formData
  return {
    ...rest,
    start_date: range_date.from.toISOString(),
    end_date: range_date.to.toISOString(),
  }
}

// Helper function to transform server data to form data
export function transformPromotionFromServer(serverData: Promotion): PromotionForm {
  const { start_date, end_date, ...rest } = serverData
  return {
    ...rest,
    range_date: {
      from: new Date(start_date),
      to: new Date(end_date),
    },
  }
} 