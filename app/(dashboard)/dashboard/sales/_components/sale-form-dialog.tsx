"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { useTRPC } from "@/trpc/client"
import { useMutation } from "@tanstack/react-query"
import type { Sale } from "@/types/sale"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Form schema
const formSchema = z.object({
  name: z.string().min(1, { message: "El nombre es requerido" }),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "RESERVED"]),
  quantity_sold: z.coerce.number().min(0, { message: "La cantidad debe ser mayor o igual a 0" }),
  link: z.string().optional(),
  purchase_date: z.date().optional(),
  sale_date: z.date().optional(),
  size: z.string().optional(),
  total_price_usd: z.coerce.number().min(0, { message: "El precio debe ser mayor o igual a 0" }),
  traveler_cost: z.coerce.number().optional(),
  warehouse_mobility: z.coerce.number().optional(),
  exchange_rate: z.coerce.number().min(0, { message: "El tipo de cambio debe ser mayor a 0" }),
  peru_price: z.coerce.number().min(0, { message: "El precio debe ser mayor o igual a 0" }),
  sale_price: z.coerce.number().optional(),
  shipping: z.coerce.number().optional(),
  quantity: z.coerce.number().min(1, { message: "La cantidad debe ser mayor o igual a 1" }),
})

type FormValues = z.infer<typeof formSchema>

interface SaleFormDialogProps {
  sale?: Sale
  onSuccess?: () => void
  trigger: React.ReactNode
}

export function SaleFormDialog({ sale, onSuccess, trigger }: SaleFormDialogProps) {
  const [open, setOpen] = useState(false)
  const isEditing = !!sale
  const trpc = useTRPC()
  
  // Initialize form with default values or sale data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: sale?.name || "",
      status: sale?.status || "ACTIVE",
      quantity_sold: sale?.quantity_sold || 0,
      link: sale?.link || "",
      purchase_date: sale?.purchase_date ? new Date(sale.purchase_date) : undefined,
      sale_date: sale?.sale_date ? new Date(sale.sale_date) : undefined,
      size: sale?.size || "",
      total_price_usd: sale?.total_price_usd || 0,
      traveler_cost: sale?.traveler_cost || 0,
      warehouse_mobility: sale?.warehouse_mobility || 0,
      exchange_rate: sale?.exchange_rate || 3.7,
      peru_price: sale?.peru_price || 0,
      sale_price: sale?.sale_price || 0,
      shipping: sale?.shipping || 0,
      quantity: sale?.quantity || 1,
    },
  })
  
  // Watch form values for calculations
  const totalPriceUsd = form.watch("total_price_usd")
  const exchangeRate = form.watch("exchange_rate")
  const travelerCost = form.watch("traveler_cost") || 0
  const warehouseMobility = form.watch("warehouse_mobility") || 0
  
  // Calculate Peru price when USD price or exchange rate changes
  const calculatePeruPrice = () => {
    const basePrice = totalPriceUsd * exchangeRate
    const additionalCosts = travelerCost + warehouseMobility
    return basePrice + additionalCosts
  }
  
  // Update Peru price when relevant fields change
  const updatePeruPrice = () => {
    const peruPrice = calculatePeruPrice()
    form.setValue("peru_price", peruPrice)
  }
  
  // Effect to update Peru price
  useEffect(() => {
    updatePeruPrice()
  }, [totalPriceUsd, exchangeRate, travelerCost, warehouseMobility])
  
  // Create or update sale mutations
  const createSaleMutation = useMutation(
    trpc.sales.create.mutationOptions({
      onSuccess: () => {
        setOpen(false)
        if (onSuccess) onSuccess()
        form.reset()
      },
      onError: (error) => {
        console.error("Error creating sale:", error)
      }
    })
  )
  
  const updateSaleMutation = useMutation(
    trpc.sales.update.mutationOptions({
      onSuccess: () => {
        setOpen(false)
        if (onSuccess) onSuccess()
        form.reset()
      },
      onError: (error) => {
        console.error("Error updating sale:", error)
      }
    })
  )
  
  const onSubmit = async (values: FormValues) => {
    // Format dates for API
    const formattedValues = {
      ...values,
      purchase_date: values.purchase_date ? format(values.purchase_date, "yyyy-MM-dd") : undefined,
      sale_date: values.sale_date ? format(values.sale_date, "yyyy-MM-dd") : undefined,
    }
    
    if (isEditing && sale) {
      updateSaleMutation.mutate({
        id: sale.id,
        sale: formattedValues,
      })
    } else {
      createSaleMutation.mutate(formattedValues)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            {isEditing ? "Editar venta" : "Nueva venta"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar venta" : "Nueva venta"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Actualiza los detalles de la venta" : "Ingresa los detalles de la nueva venta"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
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
              
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="INACTIVE">No Activo</SelectItem>
                        <SelectItem value="SOLD">Vendido</SelectItem>
                        <SelectItem value="RESERVED">Reservado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Link */}
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>URL del producto (opcional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Size */}
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>Tamaño o dimensiones (opcional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Purchase Date */}
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de compra</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            field.onChange(new Date(e.target.value))
                          } else {
                            field.onChange(undefined)
                          }
                        }}
                        max={format(new Date(), "yyyy-MM-dd")}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>Fecha en que se compró el producto</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Sale Date */}
              <FormField
                control={form.control}
                name="sale_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de venta</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            field.onChange(new Date(e.target.value))
                          } else {
                            field.onChange(undefined)
                          }
                        }}
                        max={format(new Date(), "yyyy-MM-dd")}
                        className="w-full"
                      />
                    </FormControl>
                    <FormDescription>Fecha en que se vendió el producto</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Total Price USD */}
              <FormField
                control={form.control}
                name="total_price_usd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio total USA</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Precio en dólares</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Exchange Rate */}
              <FormField
                control={form.control}
                name="exchange_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de cambio</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Valor del dólar en soles</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Traveler Cost */}
              <FormField
                control={form.control}
                name="traveler_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo viajero</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : Number(e.target.value)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Costo adicional en soles</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Warehouse Mobility */}
              <FormField
                control={form.control}
                name="warehouse_mobility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Movilidad almacén</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : Number(e.target.value)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Costo adicional en soles</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Peru Price (calculated) */}
              <FormField
                control={form.control}
                name="peru_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Perú</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        readOnly
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormDescription>Precio calculado en soles</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Sale Price */}
              <FormField
                control={form.control}
                name="sale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio de venta</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : Number(e.target.value)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Precio de venta en soles</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Shipping */}
              <FormField
                control={form.control}
                name="shipping"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Envío</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        {...field} 
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : Number(e.target.value)
                          field.onChange(value)
                        }}
                      />
                    </FormControl>
                    <FormDescription>Costo de envío en soles</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Quantity */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        step="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Cantidad total de unidades</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Quantity Sold */}
              <FormField
                control={form.control}
                name="quantity_sold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad vendida</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="1"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Unidades vendidas hasta ahora</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createSaleMutation.isPending || updateSaleMutation.isPending}
              >
                {createSaleMutation.isPending || updateSaleMutation.isPending 
                  ? "Guardando..." 
                  : isEditing ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
