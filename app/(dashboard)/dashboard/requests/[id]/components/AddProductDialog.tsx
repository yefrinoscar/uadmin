"use client"

import React, { useState, useRef, ReactNode, useEffect } from "react"
import Image from "next/image";
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Input, InputNumber } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form"
import { v4 as uuidv4 } from "uuid"
import { ImagePlus, X, DollarSign } from "lucide-react"
import { Product } from "@/trpc/api/routers/requests"
import { useRequestDetailStore } from "@/store/requestDetailStore"

// Define the schema for our form
const productSchema = z.object({
  title: z.string().min(1),
  price: z.coerce.number().min(0).optional(),
  base_price: z.coerce.number().min(0),
  profit_amount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(7),
  weight: z.coerce.number().min(0.1).default(0.5),
  description: z.string().optional(),
  source: z.string().optional(),
  imageData: z.string().optional(),
})

// Define the type based on the schema
type ProductFormData = z.infer<typeof productSchema>

export interface AddProductDialogProps {
  onAddProduct: (product: Product) => void
  children: ReactNode
}

export function AddProductDialog({
  onAddProduct,
  children
}: AddProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setCalculations, calculations, exchangeRate } = useRequestDetailStore();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      price: undefined,
      weight: 0.5,
      description: "",
      source: "manual",
      imageData: "",
      // Set base_price as 0 initially to align with schema
      base_price: 0,
      profit_amount: 0,
      tax: 7,
    },
  });

  // Reset form and image preview when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open, form]);

  // Calculate price with profit and tax
  const basePrice = form.watch("base_price")
  const profitAmount = form.watch("profit_amount")
  const tax = form.watch("tax")


  const onSubmit = (data: ProductFormData) => {

    const product: Product = {
      id: uuidv4(),
      title: data.title,
      price: Number(basePrice) + ((Number(basePrice) * Number(tax)) / 100), // Use the price with profit and tax included
      weight: data.weight,
      description: data.description || "",
      source: (data.source?.toLowerCase() || "manual") as "amazon" | "ebay" | "jomashop" | "manual",
      imageData: imagePreview || null,
      image_url: null,
      request_id: "",  // This will be set by the parent component
      base_price: data.base_price,
      profit_amount: data.profit_amount,
      tax: Number(tax),
    };

    console.log(product)

    // Set the calculator to disable profit since it's already included in the product price
    setCalculations({
      ...calculations,
      disableProfit: true
    });

    onAddProduct(product);
    setOpen(false);

    form.reset()
    setImagePreview(null)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no puede superar los 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent: ProgressEvent<FileReader>) => { 
      if (loadEvent.target?.result) {
        setImagePreview(loadEvent.target.result as string)
        form.setValue("imageData", loadEvent.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImagePreview(null)
    form.setValue("imageData", "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir producto manualmente</DialogTitle>
          <DialogDescription>
            Completa los detalles del producto que deseas añadir.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del producto" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio base ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <InputNumber type="number" placeholder="100" {...field} />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg) *</FormLabel>
                    <FormControl>
                      <InputNumber 
                        type="number" 
                        placeholder="0.5" 
                        {...field} 
                        min="0.1"
                        step="0.1"
                        required
                      />
                    </FormControl>
                    {/* <FormDescription className="text-xs">
                      Mínimo 0.1 kg
                    </FormDescription> */}
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="profit_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ganancia (S/)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <InputNumber 
                        type="number" 
                        placeholder="20" 
                        {...field} 
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Subtotal: S/ {( (Number(basePrice || 0) * (Number(exchangeRate) || 3.7)) + Number(profitAmount || 0) ).toFixed(2)} / Precio Final (con impuesto): S/ {(( (Number(basePrice || 0) * (Number(exchangeRate) || 3.7)) + Number(profitAmount || 0)) * (1 + Number(tax || 0) / 100)).toFixed(2)}
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impuesto (%)</FormLabel>
                  <FormControl>
                    <InputNumber 
                      type="number" 
                      placeholder="7" 
                      {...field} 
                      min="0"
                      step="0.01"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Porcentaje de impuesto sobre el subtotal (base + ganancia).
                  </FormDescription>
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
                    <Textarea className="h-24" placeholder="Descripción del producto (opcional)" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageData"
              render={({ field: {  } }) => (
                <FormItem>
                  <FormLabel>Imagen del producto</FormLabel>
                  <div className="space-y-2">
                    <div className="flex flex-col items-center justify-center">
                      {imagePreview ? (
                        <div className="relative w-full h-40">
                          <Image src={imagePreview} alt="Vista previa" layout="fill" objectFit="contain" className="rounded-md border" />
                          <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="w-full border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImagePlus className="h-10 w-10 text-gray-400" />
                          <span className="mt-2 text-sm text-gray-500">Haz clic para subir una imagen</span>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Añadir producto</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 