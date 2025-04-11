'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@/lib/supabase-client'
// import { proformaService } from '@/lib/services/proforma'
import { Proforma } from '@/types/proforma'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/skeletons/table-skeleton'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorMessage } from '@/components/ui/error-message'
import { FileText, Plus, PencilIcon, Eye } from 'lucide-react'
import Link from 'next/link'
import { EmptyStateSkeleton } from '@/components/skeletons/empty-state-skeleton'
import { useRouter } from 'next/navigation'

const statusColors = {
  draft: 'bg-gray-500',
  sent: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500'
} as const

function EmptyState() {
  const router = useRouter()

  return (
    <div className="text-center py-12">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
        <FileText className="h-6 w-6 text-gray-600" />
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 animate-fade-in">
          No hay proformas
        </h3>
        <p className="text-sm text-gray-400 animate-fade-in delay-150">
          Comienza creando una nueva proforma.
        </p>
      </div>
      <div className="mt-6 animate-fade-in delay-300">
        <Button onClick={() => router.push('/dashboard/invoices/proforma/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Proforma
        </Button>
      </div>
    </div>
  )
}

function ProformaListContent() {
  const { getAuthenticatedClient } = useSupabaseClient()
  const [proformas, setProformas] = useState<Proforma[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProformas = async () => {
      try {
        // const supabase = await getAuthenticatedClient()
        // const data = await proformaService.getAll(supabase)
        const data = [] as Proforma[]
        setProformas(data)
      } catch (error) {
        console.error('Error fetching proformas:', error)
        throw error
      } finally {
        setIsLoading(false)
      }
    }

    fetchProformas()
  }, [getAuthenticatedClient])

  if (isLoading) {
    return <EmptyStateSkeleton />
  }

  if (proformas.length === 0) {
    return <EmptyState />
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Lista de Proformas
        </h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proformas.map((proforma) => (
            <TableRow key={proforma.id}>
              <TableCell>{proforma.proformaInfo.number}</TableCell>
              <TableCell>
                {/* {format(new Date(proforma.proformaInfo.date), 'dd MMM yyyy', { locale: es })} */}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{proforma.client?.name}</div>
                  <div className="text-sm text-gray-500">
                    RUC: {proforma.client?.ruc}
                  </div>
                </div>
              </TableCell>
              <TableCell>{proforma.seller?.name}</TableCell>
              <TableCell>
                <div className="font-medium">
                  {proforma.proformaInfo.currency} {proforma.totalAmount.toFixed(2)}
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[proforma.status]}>
                  {proforma.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Link 
                  href={`/dashboard/invoices/proforma/preview/${proforma.id}`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-100"
                >
                  <Eye className="h-4 w-4" />
                </Link>
                <Link 
                  href={`/dashboard/invoices/proforma/edit/${proforma.id}`}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 hover:bg-gray-100"
                >
                  <PencilIcon className="h-4 w-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ProformaList() {
  return (
    <ErrorBoundary 
      fallback={
        <ErrorMessage 
          title="Error al cargar las proformas"
          message="No se pudieron cargar las proformas. Por favor, intenta nuevamente."
        />
      }
    >
      <Suspense fallback={<TableSkeleton />}>
        <ProformaListContent />
      </Suspense>
    </ErrorBoundary>
  )
} 