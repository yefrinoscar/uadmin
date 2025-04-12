'use client'

import { useProformaStore } from '@/store/proformaStore'
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from '@/components/ui/card'
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table'
import { BuildingIcon, UserIcon, CalendarIcon, BanknoteIcon } from 'lucide-react'
import { api } from '@/app/providers'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CompanyClient, ProformaItem } from '@/types'

export function SummaryStep() {
  const { proforma, getTotals } = useProformaStore()
  const [clientDetails, setClientDetails] = useState<CompanyClient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { data: clients, isLoading: isLoadingClients, error: clientsError } = 
    api.proforma.getClients.useQuery()
  
  useEffect(() => {
    if (clients && proforma.client.id) {
      const foundClient = clients.find(c => c.id === proforma.client.id)
      if (foundClient) {
        setClientDetails(foundClient)
      }
      setIsLoading(false)
    } else if (!isLoadingClients && !clientsError) {
      setIsLoading(false)
    }
    
    if (clientsError) {
      setError('Error al cargar los datos del cliente')
      setIsLoading(false)
    }
  }, [clients, proforma.client.id, isLoadingClients, clientsError])
  
  const { subtotal, tax, total } = getTotals()
  
  const expirationDate = '2025-05-01'
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Información del Cliente</CardTitle>
          <CardDescription>Datos del cliente seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          {clientDetails ? (
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <BuildingIcon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">{clientDetails.name}</div>
                  <div className="text-sm text-muted-foreground">RUC: {clientDetails.ruc}</div>
                  {clientDetails.address && (
                    <div className="text-sm text-muted-foreground mt-1">{clientDetails.address}</div>
                  )}
                </div>
              </div>
              
              {clientDetails.contact_person && (
                <div className="flex items-start space-x-3">
                  <UserIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="text-sm">{clientDetails.contact_person}</div>
                    {clientDetails.phone && (
                      <div className="text-sm text-muted-foreground">Tel: {clientDetails.phone}</div>
                    )}
                    {clientDetails.email && (
                      <div className="text-sm text-muted-foreground">{clientDetails.email}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-muted-foreground">No hay información del cliente disponible.</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Productos y Servicios</CardTitle>
          <CardDescription>Detalle de los items incluidos</CardDescription>
        </CardHeader>
        <CardContent>
          {proforma.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proforma.items.map((item: ProformaItem, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.description}</div>
                        {item.notes && <div className="text-sm text-muted-foreground">{item.notes}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                    <TableCell className="text-right">{proforma.proformaInfo.currency} {item.unit_price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{proforma.proformaInfo.currency} {item.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell colSpan={3} className="text-right font-medium">Subtotal:</TableCell>
                  <TableCell className="text-right font-medium">{proforma.proformaInfo.currency} {subtotal.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">IGV (18%):</TableCell>
                  <TableCell className="text-right font-medium">{proforma.proformaInfo.currency} {tax.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium text-lg">Total:</TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">{proforma.proformaInfo.currency} {total.toFixed(2)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground">No hay items agregados a la proforma.</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Términos y Condiciones</CardTitle>
          <CardDescription>Detalles de las condiciones de la proforma</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <BanknoteIcon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Información de Pago</div>
                  <div className="text-sm mt-1">Moneda: {proforma.proformaInfo.currency}</div>
                  <div className="text-sm">Método de pago: {proforma.conditions.paymentMethod}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CalendarIcon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Validez y Entrega</div>
                  <div className="text-sm mt-1">Fecha de expiración: {expirationDate}</div>
                  <div className="text-sm">Tiempo de entrega: {proforma.conditions.deliveryTime}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 