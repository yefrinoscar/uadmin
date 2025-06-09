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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { z } from "zod"
import { TagInput } from "@/components/ui/tag-input"
import { ArrowRight, Upload, X } from "lucide-react"
import { generateDateRange, cn } from "@/lib/utils"
import CalendarRangePicker from "@/components/calendar-range-picker"
import { 
  Promotion, 
  promotionFormSchema, 
  transformPromotionForServer,
  transformPromotionFromServer 
} from "@/lib/schemas/promotion"
import { ColorPickerCircle } from "@/components/ui/color-picker-circle"
import { Skeleton } from "@/components/ui/skeleton"
import React from "react"


interface PromotionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (promotion: Promotion) => Promise<void>
  editingPromotion: Promotion | null
  activePromotionsCount: number
}

type FormValues = z.infer<typeof promotionFormSchema>

export function PromotionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editingPromotion,
  activePromotionsCount,
}: PromotionFormDialogProps) {
  const [headerImage, setHeaderImage] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)

  // Memoize default values to avoid recreating on each render
  const defaultValues = useMemo((): FormValues => ({
    title: "",
    description: "",
    button_text: "Ver detalles",
    tags: "",
    image_url: "",
    sort_order: 0,
    active: false,
    enabled: false,
    range_date: generateDateRange(7),
    text_color: "#ffffff",
    button_background_color: "#4D2DDA",
  }), [])

  // Memoize form values based on editing state
  const formValues = useMemo((): FormValues => {
    if (!editingPromotion) return defaultValues
    
    console.log(editingPromotion, 'editingPromotion');
    
    // Transform server data to form data
    return transformPromotionFromServer({
      ...editingPromotion,
      button_text: editingPromotion.button_text || "Ver detalles",
      text_color: editingPromotion.text_color || "#ffffff",
      button_background_color: editingPromotion.button_background_color || "#4D2DDA",
      tags: editingPromotion.tags || "",
      image_url: editingPromotion.image_url || "",
      sort_order: editingPromotion.sort_order ?? 0,
      enabled: editingPromotion.enabled || false,
      start_date: editingPromotion.start_date || new Date().toISOString(),
      end_date: editingPromotion.end_date || new Date().toISOString(),
    })
  }, [editingPromotion, defaultValues])

  // Memoize initial product tags
  const initialProductTags = useMemo(() => {
    if (!editingPromotion?.tags) return []
    return editingPromotion.tags.split(',').map(tag => tag.trim())
  }, [editingPromotion?.tags])

  const [productTags, setProductTags] = useState<string[]>(() => initialProductTags)

  const form = useForm<FormValues>({
    resolver: zodResolver(promotionFormSchema),
    values: formValues, // Use values instead of defaultValues for controlled updates
  })

  const watchedValues = form.watch()

  // Effect to update headerImage when editingPromotion changes
  React.useEffect(() => {
    if (editingPromotion?.image_url) {
      setImageLoading(true)
      setHeaderImage(editingPromotion.image_url as string)
      // Simulate loading time for existing images
      setTimeout(() => setImageLoading(false), 500)
    } else {
      setHeaderImage(null)
      setImageLoading(false)
    }
  }, [editingPromotion])

  // Reset form and state when dialog opens/closes or editing promotion changes
  const resetForm = useCallback(() => {
    form.reset(formValues)
    setProductTags(initialProductTags)
    // Set image from editing promotion or clear it
    if (editingPromotion?.image_url) {
      setImageLoading(true)
      setHeaderImage(editingPromotion.image_url as string)
      setTimeout(() => setImageLoading(false), 500)
    } else {
      setHeaderImage(null)
      setImageLoading(false)
    }
  }, [form, formValues, initialProductTags, editingPromotion])

  // Reset form whenever editingPromotion changes (including when it becomes null for new promotions)
  React.useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [editingPromotion, open, resetForm])

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

    setImageLoading(true)
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setHeaderImage(result)
      // Set the base64 data directly to image_url for new uploads
      form.setValue('image_url', result)
      form.trigger('image_url')
      setImageLoading(false)
    }
    reader.onerror = () => {
      setImageLoading(false)
      toast.error("Error al cargar la imagen")
    }
    reader.readAsDataURL(file)
  }, [form])

  const removeImage = useCallback(() => {
    setHeaderImage(null)
    setImageLoading(false)
    form.setValue('image_url', "")
    form.trigger('image_url')
  }, [form])

  const handleSubmit = useCallback(async (values: FormValues) => {
    if (values.active && activePromotionsCount >= 2 && (!editingPromotion || !editingPromotion.active)) {
      toast.error("No se pueden tener más de 2 promociones activas")
      return
    }

    try {
      // Transform form data to server format
      const serverData = transformPromotionForServer({
        ...values,
        tags: productTags.join(', '),
        id: editingPromotion?.id || undefined,
        sort_order: values.sort_order ?? editingPromotion?.sort_order ?? 0
      })
      
      await onSubmit(serverData)
      handleOpenChange(false)
    } catch (error) {
      console.error("Error submitting promotion:", error)
      toast.error("Error al guardar la promoción")
    }
  }, [productTags, activePromotionsCount, editingPromotion, onSubmit, handleOpenChange])

  const handleTagsChange = useCallback((newTags: string[]) => {
    setProductTags(newTags)
    const tagsString = newTags.join(', ')
    form.setValue('tags', tagsString)
    // Trigger validation for the tags field
    form.trigger('tags')
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
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ fieldState }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <TagInput
                          tags={productTags}
                          setTags={handleTagsChange}
                          placeholder="Presiona Enter para agregar un tag..."
                          disabled={form.formState.isSubmitting}
                          hasError={!!fieldState.error}
                        />
                      </FormControl>
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
                    name="range_date"
                    render={({ field }) => (
                      <CalendarRangePicker label='Desde y hasta' range={field.value} setRange={field.onChange} />
                    )}
                  />
                </div>
              </Form>
              
              {/* Header Image */}
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ fieldState }) => (
                    <FormItem>
                      <FormLabel>Imagen de Encabezado</FormLabel>
                      <FormControl>
                        <div className={cn(
                          "border-2 border-dashed rounded-lg p-4 transition-[color,box-shadow]",
                          fieldState.error ? "border-destructive" : "border-gray-300"
                        )}>
                          {imageLoading ? (
                            <div className="space-y-3">
                              <Skeleton className="w-full h-32 rounded-lg" />
                              <div className="flex justify-center">
                                <Skeleton className="h-4 w-32" />
                              </div>
                            </div>
                          ) : headerImage ? (
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
                                onClick={() => removeImage()}
                                disabled={imageLoading}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className={cn(
                                "mx-auto h-12 w-12",
                                fieldState.error ? "text-destructive" : "text-gray-400"
                              )} />
                              <div className="mt-2">
                                <label className="cursor-pointer">
                                  <span className={cn(
                                    "text-sm",
                                    fieldState.error ? "text-destructive" : "text-gray-600"
                                  )}>
                                    Haz clic para subir imagen de encabezado
                                  </span>
                                  <input
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload('header', e)}
                                    disabled={imageLoading}
                                  />
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </Form>


            </div>
          </div>

          {/* Vista Previa Section - Above action buttons */}
          <div className="mt-8">
            <h3 className="font-semibold text-sm mb-4">Vista Previa</h3>
            <div className="rounded-xl overflow-hidden border shadow-sm">
              {imageLoading ? (
                <div className="w-full h-[85px] relative flex items-center p-4 bg-gray-50">
                  <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                  </div>
                </div>
              ) : (
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
              )}
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