'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, BuildingIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { CompanyClient } from '@/types'
import { createClientSchema, CreateClientSchema } from '@/types/schemas'
import { api } from '@/app/providers'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'

type CreateClientModalProps = {
  onClientCreated: (client: CompanyClient) => void
}

export function CreateClientModal({ onClientCreated }: CreateClientModalProps) {
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateClientSchema>({
    resolver: zodResolver(createClientSchema),
    defaultValues: {
      name: '',
      ruc: '',
      address: '',
      contact_person: '',
      phone: '',
      email: '',
    }
  })

  const createClient = api.proforma.createClient.useMutation({
    onSuccess: (data) => {
      toast.success('Cliente creado', {
        description: 'El cliente ha sido creado exitosamente.'
      })
      
      onClientCreated(data)
      setOpen(false)
      reset()
    },
    onError: (error) => {
      console.error('Error creating client:', error)
      toast.error('Error', {
        description: error.message || 'No se pudo crear el cliente. Por favor, intente nuevamente.'
      })
    }
  })

  const onSubmit = (data: CreateClientSchema) => {
    createClient.mutate(data)
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BuildingIcon className="mr-2 h-5 w-5 text-primary" />
            Crear Nuevo Cliente
          </DialogTitle>
          <DialogDescription>
            Complete los datos del cliente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre / Razón Social *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruc">RUC *</Label>
                <Input
                  id="ruc"
                  {...register('ruc')}
                  className={errors.ruc ? 'border-red-500' : ''}
                />
                {errors.ruc && (
                  <p className="text-xs text-red-500">{errors.ruc.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección *</Label>
              <Input
                id="address"
                {...register('address')}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-xs text-red-500">{errors.address.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Persona de Contacto *</Label>
                <Input
                  id="contact_person"
                  {...register('contact_person')}
                  className={errors.contact_person ? 'border-red-500' : ''}
                />
                {errors.contact_person && (
                  <p className="text-xs text-red-500">{errors.contact_person.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={createClient.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createClient.isPending} className="bg-primary">
              {createClient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Cliente
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 