'use client'

import { useEffect, useState } from 'react'
import { CompanyClient } from '@/types'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { CreateClientModal } from '../create-client-modal'
import { UserIcon, BuildingIcon, PhoneIcon, MailIcon, MapPinIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/app/providers'
import { useProformaStore } from '@/store/proformaStore'

export function ClientInfoStep() {
  const { data: clients, isLoading, error: tRPCError } = api.proforma.getClients.useQuery()
  const utils = api.useUtils()
  const [error, setError] = useState<string | null>(null)
  
  // Get client info and setter from the store
  const {  setClientInfo } = useProformaStore()

  useEffect(() => {
    if (tRPCError) {
      setError('No se pudieron cargar los clientes. Por favor, intente nuevamente.')
    }
  }, [tRPCError])

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients?.find(client => client.id === clientId)
    setClientInfo({ 
      //client_id: clientId,
      //client_name: selectedClient?.name || ''
    })
  }

  const handleClientCreated = (client: CompanyClient) => {
    // Invalidate the clients query to refetch the clients
    utils.invalidate()
    handleClientChange(client.id)
  }

  const selectedClient = clients?.find(c => c.id === "clientInfo.client_id")

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="client">Cliente</Label>
        <Select 
          value={"clientInfo.client_id"} 
          onValueChange={handleClientChange}
        >
          <SelectTrigger id="client">
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients?.length === 0 ? (
              <div className="p-2 text-center text-sm text-gray-500">
                No hay clientes disponibles
              </div>
            ) : (
              clients?.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} - RUC: {client.ruc}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedClient ? (
        <Card className="overflow-hidden border-primary/10 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <BuildingIcon className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">{selectedClient.name}</div>
                  <div className="text-sm text-gray-500">RUC: {selectedClient.ruc}</div>
                </div>
              </div>
              
              {selectedClient.address && (
                <div className="flex items-start space-x-2">
                  <MapPinIcon className="h-5 w-5 text-primary" />
                  <div className="text-sm">{selectedClient.address}</div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedClient.contact_person && (
                  <div className="flex items-center space-x-2">
                    <UserIcon className="h-5 w-5 text-primary" />
                    <div className="text-sm">{selectedClient.contact_person}</div>
                  </div>
                )}
                
                {selectedClient.phone && (
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-5 w-5 text-primary" />
                    <div className="text-sm">{selectedClient.phone}</div>
                  </div>
                )}
                
                {selectedClient.email && (
                  <div className="flex items-center space-x-2">
                    <MailIcon className="h-5 w-5 text-primary" />
                    <div className="text-sm">{selectedClient.email}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8 border border-dashed rounded-md">
          <p className="text-gray-500">
            Seleccione un cliente o cree uno nuevo
          </p>
        </div>
      )}

      <div className="pt-4">
        <CreateClientModal onClientCreated={handleClientCreated} />
      </div>
    </div>
  )
} 