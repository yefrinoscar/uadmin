"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistance } from "date-fns"
import { es } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import { PurchaseRequest } from "@/trpc/api/routers/requests"
import { PurchaseRequestStatus, purchaseRequestStatusLabels } from "../../types"
import { Loader2 } from "lucide-react"

interface RequestDetailsCardProps {
  request: PurchaseRequest
}

const StatusBadge: React.FC<{ status: PurchaseRequestStatus }> = ({ status }) => {
  switch (status) {
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border border-yellow-200">
          {purchaseRequestStatusLabels.pending}
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          {purchaseRequestStatusLabels.in_progress}
        </Badge>
      );
    case "in_transit":
      return (
        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
          {purchaseRequestStatusLabels.in_transit}
        </Badge>
      );
    case "delivered":
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border border-orange-200">
          {purchaseRequestStatusLabels.delivered}
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border border-green-200">
          {purchaseRequestStatusLabels.completed}
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200">
          {purchaseRequestStatusLabels.cancelled}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status || "Desconocido"}
        </Badge>
      );
  }
};

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
            <StatusBadge status={request.status as PurchaseRequestStatus} />
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