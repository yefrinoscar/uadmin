import * as z from "zod"

export const promotionFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  title: z.string().min(1, "El título es requerido"),
  condition_type: z.enum(["category", "tags"] as const),
  condition_content: z.string(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido"),
  active: z.boolean(),
  isMain: z.boolean(),
  start_date: z.string(),
  end_date: z.string(),
})

export type PromotionFormValues = z.infer<typeof promotionFormSchema> 