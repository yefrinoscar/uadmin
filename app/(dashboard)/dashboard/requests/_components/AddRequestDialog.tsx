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
  FormMessage,
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
    (val) => { 
      if (typeof val === "string") {
        const trimmedVal = val.trim();
        return trimmedVal === "" ? undefined : trimmedVal;
      }
      return undefined;
    },
    z.string()
      .optional()
      .transform((value, ctx) => {
        if (!value) return undefined;
        
        let phoneNumber = value.replace(/[\s()_-]/g, "");

        if (phoneNumber.startsWith("+51")) {
          phoneNumber = phoneNumber.substring(3);
        } else if (phoneNumber.startsWith("51") && phoneNumber.length > 9) {
          phoneNumber = phoneNumber.substring(2);
        }

        if (!/^\d{9}$/.test(phoneNumber)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Debe ser un número peruano de 9 dígitos. Ej: 987654321", 
          });
          return z.NEVER;
        }
        
        return `+51 ${phoneNumber.substring(0, 3)} ${phoneNumber.substring(3, 6)} ${phoneNumber.substring(6, 9)}`;
      })
  ),
  name: z.string().min(1, "El nombre es requerido."),
}).refine(
  (data) => data.email !== undefined || data.phone_number !== undefined,
  {
    message: "Debe proporcionar un correo electrónico o un número de teléfono.",
    path: ["email"]
  }
);

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

  // Handle field changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("email", value);
    // If we have a valid email, clear phone number field errors
    if (value && value.includes('@')) {
      form.clearErrors("phone_number");
    }
    form.trigger();
  };

  const handlePhoneChange = (value: string) => {
    form.setValue("phone_number", value);
    // If we have something resembling a phone number, clear email field errors
    if (value && value.replace(/[\s()_-]/g, "").length > 8) {
      form.clearErrors("email");
    }
    form.trigger();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud</DialogTitle>
          <DialogDescription>
            Crea una nueva solicitud de compra. Ingresa al menos un correo electrónico o un número de teléfono.
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
                  <FormMessage />
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
                    <Input 
                      placeholder="correo@ejemplo.com" 
                      value={field.value || ""}
                      onChange={handleEmailChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
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
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="+51 982 928 123"
                    />
                  </FormControl>
                  <FormMessage />
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