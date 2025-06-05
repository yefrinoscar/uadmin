"use client"

import { useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Promotion } from "@/types/promotion"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { z } from "zod"
import { TagInput } from "@/components/ui/tag-input"
import { Upload, X } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"

interface PromotionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (promotion: Promotion) => Promise<void>
  editingPromotion: Promotion | null
  activePromotionsCount: number
}

const formSchema = z.object({
  name: z.string(),
  title: z.string().min(1, "El título es requerido").max(60, "El título debe tener menos de 60 caracteres"),
  description: z.string().min(1, "La descripción es requerida").max(110, "La descripción debe tener menos de 110 caracteres"),
  condition_type: z.literal("tags"),
  condition_value: z.string(),
  active: z.boolean().default(false),
  is_main: z.boolean().default(false),
  start_date: z.date(),
  end_date: z.date(),
  text_color: z.string().min(4).max(9),
  background_color: z.string().min(4).max(9),
}).refine((data) => data.end_date > data.start_date, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio",
  path: ["end_date"],
})

type FormValues = z.infer<typeof formSchema>

export function PromotionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editingPromotion,
  activePromotionsCount,
}: PromotionFormDialogProps) {
  const [headerImage, setHeaderImage] = useState<string | null>(null)
  const [contentImage, setContentImage] = useState<string | null>(null)

  // Memoize default values to avoid recreating on each render
  const defaultValues = useMemo((): FormValues => ({
    name: "",
    title: "",
    description: "",
    condition_type: "tags" as const,
    condition_value: "",
    active: false,
    is_main: false,
    background_color: "#3498db",
    text_color: "#ffffff",
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }), [])

  // Memoize form values based on editing state
  const formValues = useMemo((): FormValues => {
    if (!editingPromotion) return defaultValues
    
    return {
      ...editingPromotion,
      condition_type: "tags" as const,
      text_color: editingPromotion.text_color || "#ffffff",
      background_color: editingPromotion.background_color || "#3498db",
      start_date: new Date(editingPromotion.start_date),
      end_date: new Date(editingPromotion.end_date),
    }
  }, [editingPromotion, defaultValues])

  // Memoize initial product tags
  const initialProductTags = useMemo(() => {
    if (!editingPromotion?.condition_value) return []
    return editingPromotion.condition_value.split(',').map(tag => tag.trim())
  }, [editingPromotion?.condition_value])

  const [productTags, setProductTags] = useState<string[]>(() => initialProductTags)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: formValues, // Use values instead of defaultValues for controlled updates
  })

  // Reset form and state when dialog opens/closes or editing promotion changes
  const resetForm = useCallback(() => {
    form.reset(formValues)
    setProductTags(initialProductTags)
    setHeaderImage(null)
    setContentImage(null)
  }, [form, formValues, initialProductTags])

  // Handle dialog open change with state reset
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen && open !== newOpen) {
      // Dialog is opening, reset form
      resetForm()
    }
    onOpenChange(newOpen)
  }, [open, onOpenChange, resetForm])

  const handleImageUpload = useCallback((type: 'header' | 'content', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      if (type === 'header') {
        setHeaderImage(result)
      } else {
        setContentImage(result)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const removeImage = useCallback((type: 'header' | 'content') => {
    if (type === 'header') {
      setHeaderImage(null)
    } else {
      setContentImage(null)
    }
  }, [])

  const handleSubmit = useCallback(async (values: FormValues) => {
    if (productTags.length === 0) {
      toast.error("Por favor ingrese al menos un producto")
      return
    }

    if (values.active && activePromotionsCount >= 2 && (!editingPromotion || !editingPromotion.active)) {
      toast.error("No se pueden tener más de 2 promociones activas")
      return
    }

    if (values.is_main && !values.active) {
      toast.error("Una promoción principal debe estar activa")
      return
    }

    try {
      await onSubmit({
        ...values,
        name: values.title,
        condition_value: productTags.join(', '),
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        id: editingPromotion?.id || '',
        created_at: editingPromotion?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      handleOpenChange(false)
    } catch (error) {
      console.error("Error submitting promotion:", error)
      toast.error("Error al guardar la promoción")
    }
  }, [productTags, activePromotionsCount, editingPromotion, onSubmit, handleOpenChange])

  const handleTagsChange = useCallback((newTags: string[]) => {
    setProductTags(newTags)
    form.setValue('condition_value', newTags.join(', '))
  }, [form])

  const handleStartDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      form.setValue('start_date', date)
      // If end date is before or same as start date, set it to next day
      const endDate = form.getValues('end_date')
      if (endDate <= date) {
        const newEndDate = new Date(date)
        newEndDate.setDate(date.getDate() + 1)
        form.setValue('end_date', newEndDate)
      }
    }
  }, [form])

  const handleEndDateChange = useCallback((date: Date | undefined) => {
    if (date) {
      const startDate = form.getValues('start_date')
      if (date <= startDate) {
        toast.error("La fecha de fin debe ser posterior a la fecha de inicio")
        return
      }
      form.setValue('end_date', date)
    }
  }, [form])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>
            {editingPromotion ? "Editar Promoción" : "Nueva Promoción"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <div className="grid gap-4 py-4">
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condition_value"
                  render={() => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <TagInput
                          tags={productTags}
                          setTags={handleTagsChange}
                          placeholder="Presiona Enter para agregar un tag..."
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="text_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color de Texto</FormLabel>
                        <FormControl>
                          <Input
                            type="color"
                            {...field}
                            className="h-10 px-2 py-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="background_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Button</FormLabel>
                        <FormControl>
                          <Input
                            type="color"
                            {...field}
                            className="h-10 px-2 py-1"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de inicio</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={handleStartDateChange}
                            placeholder="Selecciona fecha de inicio"
                            disabled={form.formState.isSubmitting}
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
                          <DatePicker
                            date={field.value}
                            onSelect={handleEndDateChange}
                            placeholder="Selecciona fecha de fin"
                            disabled={form.formState.isSubmitting || !form.getValues('start_date')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button"
                    onClick={() => handleOpenChange(false)}
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
              </div>
            </form>
          </Form>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Imágenes</h3>
            
            {/* Header Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen de Encabezado</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {headerImage ? (
                  <div className="relative">
                    <img 
                      src={headerImage} 
                      alt="Header preview" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage('header')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label className="cursor-pointer">
                        <span className="text-sm text-gray-600">
                          Haz clic para subir imagen de encabezado
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('header', e)}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen de Contenido</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {contentImage ? (
                  <div className="relative">
                    <img 
                      src={contentImage} 
                      alt="Content preview" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeImage('content')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label className="cursor-pointer">
                        <span className="text-sm text-gray-600">
                          Haz clic para subir imagen de contenido
                        </span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={(e) => handleImageUpload('content', e)}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}