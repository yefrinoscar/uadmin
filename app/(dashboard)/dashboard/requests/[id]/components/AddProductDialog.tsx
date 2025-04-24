"use client"

import React, { useState, useRef, ReactNode } from "react"
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
} from "@/components/ui/form"
import { v4 as uuidv4 } from "uuid"
import { ImagePlus, X } from "lucide-react"
import { Product } from "@/trpc/api/routers/requests"

// Define the schema for our form
const productSchema = z.object({
  title: z.string().min(1),
  price: z.coerce.number().min(0),
  weight: z.coerce.number().min(0),
  description: z.string().optional(),
  source: z.string().optional(),
  imageData: z.string().optional()
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
  const [open, onOpenChange] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form and image preview when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset();
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      price: undefined,
      weight: 0,
      description: "",
      source: "manual",
      imageData: "",
    },
  })

  const onSubmit = (data: ProductFormData) => {
    // Create a complete Product object with an ID
    const product: Product = {
      id: uuidv4(),
      title: data.title,
      price: Number(data.price),
      weight: data.weight,
      description: data.description || "",
      source: (data.source?.toLowerCase() || "manual") as "amazon" | "ebay" | "jomashop" | "manual",
      imageData: imagePreview || null,
      image_url: null,
      request_id: ""  // This will be set by the parent component
    }

    onAddProduct(product);
    onOpenChange(false);

    form.reset()
    setImagePreview(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no puede superar los 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string)
        form.setValue("imageData", event.target.result as string)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio ($)</FormLabel>
                    <FormControl>
                      <InputNumber type="number" placeholder="100" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                    <InputNumber type="number" placeholder="2" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

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
                        <div className="relative w-full">
                          <img src={imagePreview} alt="Vista previa" className="h-40 w-full object-contain rounded-md border" />
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