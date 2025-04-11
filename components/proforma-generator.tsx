"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ProformaData } from "@/types/proforma"
import { Edit, Eye, FileSpreadsheet } from "lucide-react"
import { useRouter } from "next/navigation"

// Replace the defaultProformaData with updated company name


// Replace the entire component with a new structure that shows the list by default
export default function ProformaGenerator() {
  const [proformas] = useState<ProformaData[]>([])
  const router = useRouter()

  return (
    <div>
        <div className="space-y-4">

          <Card>
            <CardContent className="p-6">
              {proformas.length === 0 ? (
                <div className="text-center py-8">
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No hay proformas guardadas</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Crea una nueva proforma para verla aquí.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proformas.map((proforma) => (
                      <TableRow key={proforma.id}>
                        <TableCell className="font-medium">{proforma.proformaInfo.number}</TableCell>
                        <TableCell>{proforma.proformaInfo.date}</TableCell>
                        <TableCell>{proforma.clientInfo.name || "Sin cliente"}</TableCell>
                        <TableCell>S/ {proforma.totalAmount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/invoices/proforma/preview/${proforma.id}`) }>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => router.push(`/dashboard/invoices/proforma/${proforma.id}`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  )
}

