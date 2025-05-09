"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Sale } from "@/types/sale"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { SaleFormDialog } from "./sale-form-dialog"
import { useTRPC } from "@/trpc/client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, ExternalLink } from "lucide-react"

// Helper function to format currency
const formatCurrency = (value: number | undefined, currency = "PEN") => {
  if (value === undefined) return "-"
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value)
}

// Status badge component
const StatusBadge = ({ status }: { status: Sale["status"] }) => {
  const statusConfig = {
    ACTIVE: { label: "Activo", variant: "default" },
    INACTIVE: { label: "No Activo", variant: "secondary" },
    SOLD: { label: "Vendido", variant: "success" },
    RESERVED: { label: "Reservado", variant: "warning" },
  }

  const config = statusConfig[status]
  
  return (
    <Badge variant={'default'}>{config.label}</Badge>
  )
}

interface SaleDetailsProps {
  sale: Sale
}

export function SaleDetails({ sale }: SaleDetailsProps) {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  
  // Set up delete mutation
  const deleteMutation = useMutation(
    trpc.sales.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Venta eliminada correctamente")
        queryClient.invalidateQueries({ queryKey: ["sales"] })
        router.refresh()
      },
      onError: (error) => {
        toast.error(`Error al eliminar: ${error.message}`)
      }
    })
  )
  
  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de eliminar esta venta?")) {
      deleteMutation.mutate(sale.id)
    }
  }
  
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Detalles de la venta</h2>
        <div className="flex items-center gap-2">
          <SaleFormDialog 
            sale={sale}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ["sales"] })
              toast.success("Venta actualizada correctamente")
            }}
            trigger={
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            }
          />
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Estado</h3>
            <div className="mt-1">
              <StatusBadge status={sale.status} />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
            <p className="mt-1 font-medium">{sale.name}</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Fecha de compra</h3>
            <p className="mt-1">
              {sale.purchase_date 
                ? format(new Date(sale.purchase_date), "dd MMMM yyyy", { locale: es })
                : "-"}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Fecha de venta</h3>
            <p className="mt-1">
              {sale.sale_date 
                ? format(new Date(sale.sale_date), "dd MMMM yyyy", { locale: es })
                : "-"}
            </p>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Tamaño</h3>
            <p className="mt-1">{sale.size || "-"}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Cantidad</h3>
            <p className="mt-1">{sale.quantity}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Cantidad vendida</h3>
            <p className="mt-1">{sale.quantity_sold}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Link</h3>
            <div className="mt-1">
              {sale.link ? (
                <a 
                  href={sale.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center"
                >
                  Ver enlace
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              ) : "-"}
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Precio total USA</h3>
            <p className="mt-1 font-medium">{formatCurrency(sale.total_price_usd, "USD")}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Tipo de cambio</h3>
            <p className="mt-1">{sale.exchange_rate}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Costo viajero</h3>
            <p className="mt-1">{formatCurrency(sale.traveler_cost)}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Movilidad almacén</h3>
            <p className="mt-1">{formatCurrency(sale.warehouse_mobility)}</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Precio Perú</h3>
            <p className="mt-1 font-medium">{formatCurrency(sale.peru_price)}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Precio de venta</h3>
            <p className="mt-1 font-medium">{formatCurrency(sale.sale_price)}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Costo de envío</h3>
            <p className="mt-1">{formatCurrency(sale.shipping)}</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Ganancia</h3>
            <p className={`mt-1 font-medium ${(sale.profit || 0) < 0 ? "text-red-500" : "text-green-500"}`}>
              {formatCurrency(sale.profit)}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Ganancia real</h3>
            <p className={`mt-1 font-medium ${(sale.real_profit || 0) < 0 ? "text-red-500" : "text-green-500"}`}>
              {formatCurrency(sale.real_profit)}
            </p>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Fecha de creación</h3>
            <p className="mt-1 text-sm">
              {format(new Date(sale.created_at), "dd MMMM yyyy, HH:mm", { locale: es })}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Última actualización</h3>
            <p className="mt-1 text-sm">
              {format(new Date(sale.updated_at), "dd MMMM yyyy, HH:mm", { locale: es })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
