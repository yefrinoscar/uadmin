"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistance } from "date-fns"
import { es } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import { PurchaseRequest } from "@/trpc/api/routers/requests"

interface RequestDetailsCardProps {
  request: PurchaseRequest
}

export function RequestDetailsCard({ request }: RequestDetailsCardProps) {
  return (
    <Card>
      {/* <CardHeader>
        <CardTitle className="text-xl font-semibold">Detalle de pedido</CardTitle>
      </CardHeader> */}
      <CardContent className="text-sm grid grid-cols-2">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 col-span-1">
          <Label className="text-muted-foreground text-right">ID de pedido:</Label>
          <span className="font-mono font-medium">#{request.id}</span>

          <Label className="text-muted-foreground text-right">Descripción:</Label>
          <p className="font-medium text-wrap">{request.description}</p>

          <Label className="text-muted-foreground text-right">Estado:</Label>
          <div>
            <Badge variant={request.status === "approved" ? "success" : request.status === "rejected" ? "destructive" : "warning"}>
              {request.status === "approved" ? "Aprobado" : request.status === "rejected" ? "Rechazado" : "Pendiente"}
            </Badge>
          </div>

          <Label className="text-muted-foreground text-right">Nombre del cliente:</Label>
          <span className="font-semibold">{request.client?.name || "-"}</span>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 col-span-1">
          <Label className="text-muted-foreground text-right pt-1">Email del cliente:</Label>
          <span className="font-semibold">{request.client?.email || "-"}</span>

          <Label className="text-muted-foreground text-right pt-1">Telefono del cliente:</Label>
          <span className="font-semibold">{request.client?.phone_number || "-"}</span>

          <Label className="text-muted-foreground text-right">Creado:</Label>
          <span>{request.created_at ? formatDistance(new Date(request.created_at), new Date(), { addSuffix: true, locale: es }) : "-"}</span>

          <Label className="text-muted-foreground text-right">Actualizado:</Label>
          <span>{request.updated_at ? formatDistance(new Date(request.updated_at), new Date(), { addSuffix: true, locale: es }) : "-"}</span>
        </div>
      </CardContent>
    </Card>
  )
}