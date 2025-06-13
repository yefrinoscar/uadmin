"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Copy, Clock, XCircle, MoreVertical, Power, PowerOff } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Promotion } from "@/lib/schemas/promotion"

interface PromotionCardProps {
  promotion: Promotion
  isActive: boolean
  onClick?: () => void
  onEdit: (promotion: Promotion) => void
  onDelete: (promotion: Promotion) => Promise<void>
  onDuplicate: (promotion: Promotion) => void
  onToggleActive?: (promotion: Promotion) => void
  enabled?: boolean
  isPending: boolean
  isReplacing: boolean
  onSetMain?: (promotion: Promotion) => void
  showDuplicate?: boolean
  isPublic?: boolean
}

// Helper function to get promotion status
function getPromotionStatus(promotion: Promotion) {
  const now = new Date()
  const startDate = new Date(promotion.start_date)

  if (!promotion.enabled) return { status: 'disabled', color: 'gray', icon: PowerOff, label: 'Deshabilitada' }
  if (now < startDate) return { status: 'pending', color: 'blue', icon: Clock, label: 'Pendiente' }
  
  // Check if expired (only if end_date exists)
  if (promotion.end_date !== null && promotion.end_date !== undefined) {
    const endDate = new Date(promotion.end_date)
    if (now > endDate) return { status: 'expired', color: 'red', icon: XCircle, label: 'Expirada' }
  }
  
  return { status: 'active', color: 'green', icon: Power, label: 'Habilitada' }
}

export function PromotionCard({
  promotion,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleActive,
  isPending,
  showDuplicate = false,
  isPublic = false
}: PromotionCardProps) {
  const startDate = new Date(promotion.start_date)
  const now = new Date()
  const statusInfo = getPromotionStatus(promotion)
  const StatusIcon = statusInfo.icon

  // Calculate if promotion is currently live
  const isCurrentlyLive = promotion.enabled && now >= startDate && (
    promotion.end_date === null || 
    promotion.end_date === undefined || 
    now <= new Date(promotion.end_date)
  )

  return (
    <Card
      className={cn(
        "transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-lg",
        isCurrentlyLive ? "ring-2 ring-green-500/20 bg-green-50/50" : "",
        statusInfo.status === 'expired' ? "opacity-70" : "",
        statusInfo.status === 'disabled' ? "opacity-60 bg-gray-50/50 ring-1 ring-gray-200" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-start">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header with status and toggle */}
          <div className="flex items-center justify-between mb-3">
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <StatusIcon 
                className={cn(
                  "w-4 h-4",
                  statusInfo.color === 'green' && "text-green-600",
                  statusInfo.color === 'blue' && "text-blue-600", 
                  statusInfo.color === 'red' && "text-red-600",
                  statusInfo.color === 'gray' && "text-gray-500"
                )} 
              />
              <span className={cn(
                "text-xs font-medium",
                statusInfo.color === 'green' && "text-green-600",
                statusInfo.color === 'blue' && "text-blue-600",
                statusInfo.color === 'red' && "text-red-600", 
                statusInfo.color === 'gray' && "text-gray-500"
              )}>
                {statusInfo.label}
              </span>
            </div>

            {/* Enable/Disable Toggle Switch - Show for all promotions when not public */}
            {onToggleActive && !isPublic && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={promotion.enabled}
                        onCheckedChange={() => {
                          onToggleActive(promotion);
                        }}
                        disabled={isPending}
                        className={cn(
                          "data-[state=checked]:bg-green-500",
                          !promotion.enabled && "data-[state=unchecked]:bg-gray-300"
                        )}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{promotion.enabled ? "Deshabilitar promoción" : "Habilitar promoción"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <h3 className="text-base font-semibold mb-1 line-clamp-1">{promotion.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {promotion.description}
          </p>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-3 text-sm p-3 bg-muted/30 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Inicio</div>
                <div className="font-medium">{format(startDate, "d MMM yyyy", { locale: es })}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-muted-foreground">Fin</div>
                <div className="font-medium">
                  {promotion.end_date ? format(new Date(promotion.end_date), "d MMM yyyy", { locale: es }) : "Sin límite"}
                </div>
              </div>
            </div>

            {/* Duration indicator */}
            <div className="text-xs text-muted-foreground text-center">
              {!promotion.enabled ? (
                "Promoción deshabilitada"
              ) : now < startDate ? (
                `Inicia en ${Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} días`
              ) : !promotion.end_date ? (
                "Promoción indefinida"
              ) : now > new Date(promotion.end_date) ? (
                `Expiró hace ${Math.ceil((now.getTime() - new Date(promotion.end_date).getTime()) / (1000 * 60 * 60 * 24))} días`
              ) : (
                `Activa por ${Math.ceil((new Date(promotion.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} días más`
              )}
            </div>
          </div>

          {/* Condition info */}
          <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted/20 rounded">
            <strong>Tags:</strong> {promotion.tags}
          </div>

          {/* Actions */}
          {!isPublic && (
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(promotion);
                }}
                disabled={isPending}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isPending}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {showDuplicate && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(promotion);
                      }}
                      disabled={isPending}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(promotion);
                    }}
                    disabled={isPending}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
