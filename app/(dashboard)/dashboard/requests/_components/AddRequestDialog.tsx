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
import { useMutation } from "@tanstack/react-query"

const formSchema = z.object({
  description: z.string().min(1, "La descripción es requerida."),
  email: z.preprocess(
    (val) => (val === "" || (typeof val === "string" && val.trim() === "") ? undefined : val),
    z.string().email("El formato del correo electrónico no es válido.").optional()
  ),
  phone_number: z.preprocess(
    (val) => (val === "" || (typeof val === "string" && val.trim() === "") ? undefined : val),
    z.string().optional()
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
      path: ["phone"],
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      email: "",
      phone_number: "",
      name: "",
    },
  })
  
  const createRequestMutationOptions = trpc.requests.create.mutationOptions({
    onSuccess: () => {
      toast.success("Solicitud creada exitosamente")
      setOpen(false)
      form.reset()
      onRequestAdded?.()
    },
    onError: (error) => {
      toast.error(`Error al crear la solicitud: ${error.message}`)
    },
  });


  const createRequestMutation = useMutation(createRequestMutationOptions);

  const onSubmit = async (data: FormData) => {
    console.log("data", data);
    
    await createRequestMutation.mutateAsync(data)
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
                  <FormLabel>Descripción</FormLabel>
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
                  <FormLabel>Email</FormLabel>
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
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="+51 999999999" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
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