import * as z from "zod"

export const promotionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "El título es requerido").max(60, "El título debe tener menos de 60 caracteres"),
  description: z.string().min(1, "La descripción es requerida").max(110, "La descripción debe tener menos de 110 caracteres"),
  button_text: z.string().min(1, "El texto del botón es requerido").max(20, "El texto del botón debe tener menos de 20 caracteres"),
  tags: z.string(),
  order: z.number().nullable(),
  active: z.boolean().default(false),
  enabled: z.boolean().default(false),
  start_date: z.date(),
  end_date: z.date(),
  button_background_color: z.string().min(4).max(9),
  text_color: z.string().min(4).max(9),
}).refine((data) => data.end_date > data.start_date, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["end_date"],
})

export type Promotion = z.infer<typeof promotionSchema> 