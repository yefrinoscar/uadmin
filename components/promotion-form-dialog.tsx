"use client"

import { useState, useEffect } from "react"
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
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { toast } from "sonner"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { z } from "zod"
import { TagInput } from "@/components/ui/tag-input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Sparkles, Tag, ArrowRight } from "lucide-react"

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

const formSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  title: z.string().min(1, "El título es requerido"),
  condition_type: z.enum(["category", "tags"]),
  condition_value: z.string(),
  active: z.boolean().default(false),
  is_main: z.boolean().default(false),
  start_date: z.string(),
  end_date: z.string(),
  text_color: z.string().min(4).max(9),
  background_color: z.string().min(4).max(9),
})

type FormValues = z.infer<typeof formSchema>

export function PromotionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editingPromotion,
  activePromotionsCount,
}: PromotionFormDialogProps) {
  const [productTags, setProductTags] = useState<string[]>([])
  const [previewColors, setPreviewColors] = useState({
    text_color: "#000000",
    background_color: "#F3F4F6"
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      title: "",
      condition_type: "category",
      condition_value: "",
      active: false,
      is_main: false,
      background_color: "#F3F4F6",
      text_color: "#000000",
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  })

  // Reset form when dialog opens for new promotion
  useEffect(() => {
    if (open && !editingPromotion) {
      form.reset()
      setProductTags([])
      setPreviewColors({
        text_color: "#000000",
        background_color: "#F3F4F6"
      })
    }
  }, [open, editingPromotion, form])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
      setProductTags([])
      setPreviewColors({
        text_color: "#000000",
        background_color: "#F3F4F6"
      })
    }
  }, [open, form])

  // Set form values when editing
  useEffect(() => {
    if (editingPromotion) {
      form.reset({
        ...editingPromotion,
        text_color: editingPromotion.text_color || "#000000",
        background_color: editingPromotion.background_color || "#F3F4F6",
      })
      setPreviewColors({
        text_color: editingPromotion.text_color || "#000000",
        background_color: editingPromotion.background_color || "#F3F4F6"
      })

      if (editingPromotion.condition_type === "tags") {
        setProductTags(editingPromotion.condition_value.split(',').map(tag => tag.trim()))
      }
    }
  }, [editingPromotion, form])

  // Update preview colors when color inputs are dropped/changed
  const handleColorChange = (field: "text_color" | "background_color", value: string) => {
    setPreviewColors(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (values: FormValues) => {
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

    if (values.is_main && !values.active) {
      toast.error("Una promoción principal debe estar activa")
      return
    }

    try {
      await onSubmit({
        ...values,
        condition_value: values.condition_type === "category"
          ? values.condition_value
          : productTags.join(', '),
        id: editingPromotion?.id || '',
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
                    name="condition_value"
                    render={() => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <TagInput
                            tags={productTags}
                            setTags={(newTags) => {
                              setProductTags(newTags)
                              form.setValue('condition_value', newTags.join(', '))
                            }}
                            placeholder="Presiona Enter para agregar un tag..."
                            disabled={form.formState.isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="condition_value"
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
                            onChange={(e) => {
                              field.onChange(e.target.value)
                            }}
                            onBlur={(e) => {
                              handleColorChange("text_color", e.target.value)
                            }}
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
                        <FormLabel>Color de Fondo</FormLabel>
                        <FormControl>
                          <Input
                            type="color"
                            {...field}
                            className="h-10 px-2 py-1"
                            onChange={(e) => {
                              field.onChange(e.target.value)
                            }}
                            onBlur={(e) => {
                              handleColorChange("background_color", e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
              </div>
            </form>
          </Form>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Vista Previa</h3>
            <Tabs defaultValue="banner" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="banner">Banner</TabsTrigger>
                <TabsTrigger value="notification">Notificación</TabsTrigger>
              </TabsList>

              <TabsContent value="banner" className="mt-2">
                <div className="rounded-xl overflow-hidden border shadow-sm">
                  <div 
                    className="w-full h-48 relative flex items-center overflow-hidden"
                    style={{ 
                      backgroundColor: previewColors.background_color,
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {/* Decorative elements */}
                    <div 
                      className="absolute right-0 top-0 w-32 h-32 transform translate-x-16 -translate-y-8 rounded-full opacity-20"
                      style={{ 
                        backgroundColor: previewColors.text_color,
                      }}
                    />
                    <div 
                      className="absolute left-0 bottom-0 w-24 h-24 transform -translate-x-12 translate-y-12 rounded-full opacity-10"
                      style={{ 
                        backgroundColor: previewColors.text_color,
                      }}
                    />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-center px-8">
                      <div className="max-w-[90%] space-y-4">
                        <div className="flex items-center gap-2">
                          <Sparkles 
                            className="w-5 h-5"
                            style={{ color: previewColors.text_color }}
                          />
                          <span 
                            className="text-sm font-medium uppercase tracking-wider"
                            style={{ color: previewColors.text_color }}
                          >
                            Promoción Especial
                          </span>
                        </div>
                        <h3 
                          className="text-3xl font-bold leading-tight tracking-tight"
                          style={{ 
                            color: previewColors.text_color,
                            transition: 'all 0.2s ease-in-out'
                          }}
                        >
                          {form.watch('title') || 'Título de la promoción'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            className="group hover:translate-x-1 transition-transform"
                            style={{
                              backgroundColor: `${previewColors.text_color}20`,
                              color: previewColors.text_color,
                            }}
                          >
                            Ver detalles
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notification" className="mt-2 space-y-4">
                <div className="rounded-xl overflow-hidden border shadow-sm">
                  <div 
                    className="w-full py-3 px-4 relative"
                    style={{ 
                      backgroundColor: previewColors.background_color,
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden"
                        style={{
                          backgroundColor: `${previewColors.text_color}15`,
                          color: previewColors.text_color
                        }}
                      >
                        <Tag className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="text-sm font-semibold truncate"
                          style={{ color: previewColors.text_color }}
                        >
                          {form.watch('title') || 'Título de la promoción'}
                        </h3>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-xs h-8"
                        style={{ color: previewColors.text_color }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border shadow-sm">
                  <div 
                    className="w-full p-4 relative"
                    style={{ 
                      backgroundColor: previewColors.background_color,
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${previewColors.text_color}15`,
                          color: previewColors.text_color
                        }}
                      >
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="text-xs font-medium mb-1"
                          style={{ color: `${previewColors.text_color}90` }}
                        >
                          Ahora
                        </div>
                        <h3 
                          className="text-sm font-semibold mb-1"
                          style={{ color: previewColors.text_color }}
                        >
                          {form.watch('title') || 'Título de la promoción'}
                        </h3>
                        <Button 
                          variant="secondary"
                          size="sm"
                          className="mt-2 text-xs h-8"
                          style={{
                            backgroundColor: `${previewColors.text_color}15`,
                            color: previewColors.text_color
                          }}
                        >
                          Ver promoción
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="text-sm text-muted-foreground">
              <p>Los colores se actualizarán al soltar el selector de color.</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 