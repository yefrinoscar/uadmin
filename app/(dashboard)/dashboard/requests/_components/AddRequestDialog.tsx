"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTRPC } from "@/trpc/client"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { InputMask } from '@react-input/mask';
import { useUser } from "@clerk/nextjs"

const formSchema = z.object({
  description: z.string().min(1, "La descripción es requerida."),
  email: z.preprocess(
    (val) => (val === "" || (typeof val === "string" && val.trim() === "") ? undefined : val),
    z.string().email("El formato del correo electrónico no es válido.").optional()
  ),
  phone_number: z.preprocess(
    (val) => { // Normalize input: empty strings or only whitespace become undefined
      if (typeof val === "string") {
        const trimmedVal = val.trim();
        return trimmedVal === "" ? undefined : trimmedVal;
      }
      return undefined; // If not a string, treat as undefined
    },
    z.string()
      .optional() // The field itself is optional
      .transform((value, ctx) => { // This transform runs if 'value' is a string (i.e., not undefined)
        // 'value' here is the result from preprocess that is not undefined.
        // Ensure underscores from partial mask input are also removed.
        let phoneNumber = value?.replace(/[\s()_-]/g, "") || ""; // Clean spaces, parentheses, hyphens, and underscores

        // Handle +51 or 51 prefix for validation
        if (phoneNumber?.startsWith("+51")) {
          phoneNumber = phoneNumber.substring(3);
        } else if (phoneNumber?.startsWith("51") && phoneNumber?.length > 9) { 
          // Catches cases like "51987654321" where "51" is part of a national number + country code
          phoneNumber = phoneNumber.substring(2);
        }
        // If no prefix, phoneNumber remains as is, to be validated for 9 digits.

        // Validate that the remaining part consists of exactly 9 digits
        if (!/^\d{9}$/.test(phoneNumber)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            // Using a more specific message that includes format expectation
            message: "Debe ser un número peruano de 9 dígitos. Ej: 987654321", 
          });
          return z.NEVER; // Important for Zod to handle the error correctly
        }
        
        // Format the number as +51 XXX XXX XXX
        return `+51 ${phoneNumber.substring(0, 3)} ${phoneNumber.substring(3, 6)} ${phoneNumber.substring(6, 9)}`;
      })
  ),
  name: z.string().min(1, "El nombre es requerido."),
}).superRefine((data, ctx) => {
  if (data.email === undefined && data.phone_number === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe proporcionar un correo electrónico o un número de teléfono.",
      path: ["email"],
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe proporcionar un correo electrónico o un número de teléfono.",
      path: ["phone_number"],
    });
  }
});

type FormData = z.infer<typeof formSchema>;

interface AddRequestDialogProps {
  children: React.ReactNode;
  onRequestAdded?: () => void;
}

export function AddRequestDialog({ children, onRequestAdded }: AddRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const trpc = useTRPC()
  const queryClient = useQueryClient();
  const { user } = useUser()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur',
    defaultValues: {
      description: "",
      email: "",
      phone_number: "",
      name: ""
    },
  })

  
  
  const createRequestMutationOptions = trpc.requests.create.mutationOptions({
    onSuccess: () => {
      toast.success("Solicitud creada exitosamente")
      setOpen(false)
      form.reset()
      onRequestAdded?.()
      
       // Invalidate the query using the obtained key
       queryClient.invalidateQueries({ queryKey: trpc.requests.getAll.queryKey() });
    },
    onError: (error) => {
      toast.error(`Error al crear la solicitud: ${error.message}`)
    },
  });


  const createRequestMutation = useMutation(createRequestMutationOptions);

  const onSubmit = async (data: FormData) => {    
    await createRequestMutation.mutateAsync({ ...data, user_id: user?.id || '' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud</DialogTitle>
          <DialogDescription>
            Crea una nueva solicitud de compra. Ingresa al menos el nombre o teléfono del cliente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe lo que necesitas..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Email</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Teléfono</FormLabel>
                  <FormControl>
                    <InputMask
                      mask="+51 ___ ___ ___"
                      replacement={{ _: /\d/ }}
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="+51 982 928 123"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del cliente" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createRequestMutation.isPending}
                className="cursor-pointer"
              >
                {createRequestMutation.isPending ? "Creando..." : "Crear Solicitud"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 