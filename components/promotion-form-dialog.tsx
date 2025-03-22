"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TagInput } from "@/components/tag-input"
import type { Promotion } from "@/types/promotion"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { toast } from "sonner"
import { promotionFormSchema, type PromotionFormValues } from "@/lib/schemas/promotion-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ColorPicker } from "@/components/ui/color-picker"

interface PromotionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (promotion: Promotion) => Promise<void>
  editingPromotion: Promotion | null
  activePromotionsCount: number
}

const CONDITION_TYPES = [
  { value: "category", label: "Categoría" },
  { value: "tags", label: "Tags" }
] as const

export function PromotionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editingPromotion,
  activePromotionsCount,
}: PromotionFormDialogProps) {
  const [productTags, setProductTags] = useState<string[]>([])

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      name: "",
      title: "",
      condition_type: "category",
      condition_content: "",
      backgroundColor: "#FFFFFF",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  })

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
      setProductTags([])
    }
  }, [open, form])

  // Set form values when editing
  useEffect(() => {
    if (editingPromotion) {
      form.reset({
        name: editingPromotion.name,
        title: editingPromotion.title,
        condition_type: editingPromotion.condition_type,
        condition_content: editingPromotion.condition_type === "category" 
          ? editingPromotion.condition_content 
          : "",
        backgroundColor: editingPromotion.backgroundColor,
        start_date: editingPromotion.start_date,
        end_date: editingPromotion.end_date,
      })

      if (editingPromotion.condition_type === "tags") {
        setProductTags(editingPromotion.condition_content.split(',').map(item => item.trim()).filter(Boolean))
      }
    }
  }, [editingPromotion, form])

  const handleSubmit = async (values: PromotionFormValues) => {
    const startDate = new Date(values.start_date)
    const endDate = new Date(values.end_date)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error("Por favor seleccione fechas válidas")
      return
    }

    if (endDate <= startDate) {
      toast.error("La fecha de fin debe ser posterior a la fecha de inicio")
      return
    }

    if (values.condition_type === "tags" && productTags.length === 0) {
      toast.error("Por favor ingrese al menos un producto")
      return
    }

    if (values.active && activePromotionsCount >= 2 && (!editingPromotion || !editingPromotion.active)) {
      toast.error("No se pueden tener más de 2 promociones activas")
      return
    }

    if (values.isMain && !values.active) {
      toast.error("Una promoción principal debe estar activa")
      return
    }

    const conditionContent = values.condition_type === "category"
      ? values.condition_content
      : productTags.join(', ')

    try {
      await onSubmit({
        ...values,
        condition_content: conditionContent,
        id: editingPromotion?.id || "",
        created_at: editingPromotion?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting promotion:", error)
      toast.error("Error al guardar la promoción")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingPromotion ? "Editar Promoción" : "Crear Promoción"}</DialogTitle>
          <DialogDescription>
            {editingPromotion ? "Actualiza los detalles de la promoción" : "Completa los detalles para crear una nueva promoción"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="condition_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Condición</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de condición" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONDITION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('condition_type') === 'tags' ? (
              <FormField
                control={form.control}
                name="condition_content"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagInput
                        tags={productTags}
                        setTags={setProductTags}
                        placeholder="Presiona Enter para agregar un tag"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="condition_content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color de fondo</FormLabel>
                  <FormControl>
                    <ColorPicker
                      color={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de inicio</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => {
                        if (date) {
                          field.onChange(date.toISOString())
                          // Check end_date and update if needed
                          const endDate = form.getValues('end_date')
                          if (endDate && new Date(endDate) <= date) {
                            const newEndDate = new Date(date)
                            newEndDate.setHours(date.getHours() + 1)
                            form.setValue('end_date', newEndDate.toISOString())
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de fin</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      date={field.value ? new Date(field.value) : undefined}
                      setDate={(date) => {
                        if (date) {
                          const startDate = new Date(form.getValues('start_date'))
                          if (date <= startDate) {
                            toast.error("La fecha de fin debe ser posterior a la fecha de inicio")
                            return
                          }
                          field.onChange(date.toISOString())
                        }
                      }}
                      minDate={new Date(form.getValues('start_date'))}
                      disabled={!form.getValues('start_date')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                variant="outline" 
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Guardando..." : editingPromotion ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 