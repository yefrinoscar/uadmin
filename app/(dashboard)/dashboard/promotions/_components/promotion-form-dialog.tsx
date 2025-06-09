"use client"

import { useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { z } from "zod"
import { TagInput } from "@/components/ui/tag-input"
import { Upload, X, Sparkles, ArrowRight } from "lucide-react"
import { DatePicker } from "@/components/ui/date-picker"
import { ColorPickerCircle } from "@/components/ui/color-picker-circle"
import { Promotion, promotionSchema } from "@/lib/schemas/promotion"

interface PromotionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (promotion: Promotion) => Promise<void>
  editingPromotion: Promotion | null
  activePromotionsCount: number
}


type FormValues = z.infer<typeof promotionSchema>

export function PromotionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editingPromotion,
  activePromotionsCount,
}: PromotionFormDialogProps) {
  const [headerImage, setHeaderImage] = useState<string | null>(null)

  // Memoize default values to avoid recreating on each render
  const defaultValues = useMemo((): FormValues => ({
    title: "",
    description: "",
    button_text: "Ver detalles",
    tags: "",
    order: null,
    active: false,
    enabled: true,
    text_color: "#ffffff",
    button_background_color: "#4D2DDA",
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }), [])

  // Memoize form values based on editing state
  const formValues = useMemo((): FormValues => {
    if (!editingPromotion) return defaultValues
    
    return {
      ...editingPromotion,
      button_text: (editingPromotion as any).button_text || "Ver detalles",
      text_color: editingPromotion.text_color || "#ffffff",
      button_background_color: editingPromotion.button_background_color || "#4D2DDA",
      tags: editingPromotion.tags || "",
      order: (editingPromotion as any).order || null,
      enabled: (editingPromotion as any).enabled || false,
      start_date: new Date(editingPromotion.start_date),
      end_date: new Date(editingPromotion.end_date),
    }
  }, [editingPromotion, defaultValues])

  // Memoize initial product tags
  const initialProductTags = useMemo(() => {
    if (!editingPromotion?.tags) return []
    return editingPromotion.tags.split(',').map(tag => tag.trim())
  }, [editingPromotion?.tags])

  const [productTags, setProductTags] = useState<string[]>(() => initialProductTags)

  const form = useForm<FormValues>({
    resolver: zodResolver(promotionSchema),
    values: formValues, // Use values instead of defaultValues for controlled updates
  })

  // Watch form values for preview
  const watchedValues = form.watch()

  // Reset form and state when dialog opens/closes or editing promotion changes
  const resetForm = useCallback(() => {
    form.reset(formValues)
    setProductTags(initialProductTags)
    setHeaderImage(null)
  }, [form, formValues, initialProductTags])

  // Handle dialog open change with state reset
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen && open !== newOpen) {
      // Dialog is opening, reset form
      resetForm()
    }
    onOpenChange(newOpen)
  }, [open, onOpenChange, resetForm])

  const handleImageUpload = useCallback((type: 'header', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setHeaderImage(result)
    }
    reader.readAsDataURL(file)
  }, [])

  const removeImage = useCallback((type: 'header') => {
    setHeaderImage(null)
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



    try {
      await onSubmit({
        ...values,
        tags: productTags.join(', '),
        id: editingPromotion?.id || undefined,
      })
      handleOpenChange(false)
    } catch (error) {
      console.error("Error submitting promotion:", error)
      toast.error("Error al guardar la promoción")
    }
  }, [productTags, activePromotionsCount, editingPromotion, onSubmit, handleOpenChange])

  const handleTagsChange = useCallback((newTags: string[]) => {
    setProductTags(newTags)
    form.setValue('tags', newTags.join(', '))
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
      <DialogContent className="sm:max-w-[900px] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingPromotion ? "Editar Promoción" : "Nueva Promoción"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form {...form}>
              <div className="space-y-4">
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
                  name="button_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto del Botón</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Ver detalles, Comprar ahora" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
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
                          <ColorPickerCircle
                            color={field.value}
                            onChange={field.onChange}
                            disabled={form.formState.isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="button_background_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Button</FormLabel>
                        <FormControl>
                          <ColorPickerCircle
                            color={field.value}
                            onChange={field.onChange}
                            disabled={form.formState.isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Enabled
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this promotion to make it visible
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={form.formState.isSubmitting}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

              </div>
            </Form>

            <div className="space-y-4">
              {/* Dates Section */}
              <Form {...form}>
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
                            disabledDates={{
                              before: form.getValues('start_date') 
                                ? form.getValues('start_date')
                                : new Date()
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
              
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


            </div>
          </div>

          {/* Vista Previa Section - Above action buttons */}
          <div className="mt-8">
            <h3 className="font-semibold text-sm mb-4">Vista Previa</h3>
            <div className="rounded-xl overflow-hidden border shadow-sm">
                            <div 
                className="w-full h-[85px] relative flex items-center overflow-hidden"
                style={{ 
                  backgroundImage: headerImage ? `url(${headerImage})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: 'transparent'
                }}
              >
                {/* Gradient overlay for text contrast */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 50%)`
                  }}
                />
                
                {/* Content */}
                <div className="absolute inset-0 flex items-center px-4 z-10">
                  <div className="flex flex-col gap-2">
                    <p 
                      className="text-base font-medium opacity-90 truncate"
                      style={{ 
                        color: watchedValues.text_color || "#ffffff"
                      }}
                    >
                      {watchedValues.description || 'Descripción de la promoción'}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="group hover:translate-x-1 transition-transform shrink-0 w-fit"
                                                                    style={{
                        backgroundColor: watchedValues.button_background_color || "#4D2DDA",
                        color: watchedValues.text_color || "#ffffff",
                      border: 'none'
                      }}
                    >
                      {watchedValues.button_text || 'Ver detalles'}
                      <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer - Right aligned */}
        <div className="p-4">
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={form.handleSubmit(handleSubmit)}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Guardando..." : editingPromotion ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}