"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Copy, CircleDashed, Zap, Clock, XCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Promotion } from "@/types/promotion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface PromotionCardProps {
  promotion: Promotion
  isActive: boolean
  onClick?: () => void
  onEdit: (promotion: Promotion) => void
  onDelete: (promotion: Promotion) => Promise<void>
  onDuplicate: (promotion: Promotion) => void
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
  const endDate = new Date(promotion.end_date)
  
  if (!promotion.active) return { status: 'inactive', color: 'gray', icon: CircleDashed, label: 'Inactiva' }
  if (now < startDate) return { status: 'pending', color: 'blue', icon: Clock, label: 'Pendiente' }
  if (now > endDate) return { status: 'expired', color: 'red', icon: XCircle, label: 'Expirada' }
  return { status: 'active', color: 'green', icon: Zap, label: 'Activa' }
}

export function PromotionCard({ 
  promotion, 
  isActive,
  onClick,
  onEdit, 
  onDelete, 
  onSetMain,
  onDuplicate,
  isPending,
  showDuplicate = false,
  isPublic = false
}: PromotionCardProps) {
  const startDate = new Date(promotion.start_date)
  const endDate = new Date(promotion.end_date)
  const now = new Date()
  const statusInfo = getPromotionStatus(promotion)
  const StatusIcon = statusInfo.icon

  // Calculate if promotion is currently live (regardless of active flag)
  const isCurrentlyLive = now >= startDate && now <= endDate && promotion.active

  return (
    <Card 
      className={cn(
        "transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-lg",
        isCurrentlyLive ? "ring-2 ring-green-500/20 bg-green-50/50" : "",
        statusInfo.status === 'expired' ? "opacity-70" : "",
        promotion.is_main ? "border-yellow-500 bg-yellow-50/50" : ""
      )}
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div 
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
              statusInfo.color === 'green' ? "bg-green-100 text-green-600" :
              statusInfo.color === 'blue' ? "bg-blue-100 text-blue-600" :
              statusInfo.color === 'red' ? "bg-red-100 text-red-600" :
              "bg-gray-100 text-gray-600"
            )}
          >
            <StatusIcon className="w-6 h-6" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {/* Status indicator */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  statusInfo.color === 'green' ? "bg-green-500" :
                  statusInfo.color === 'blue' ? "bg-blue-500" :
                  statusInfo.color === 'red' ? "bg-red-500" :
                  "bg-gray-400"
                )} />
                <span className="text-xs font-medium text-muted-foreground">
                  {statusInfo.label}
                </span>
              </div>
              
              {isCurrentlyLive && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  En Vivo
                </span>
              )}
              
              {promotion.is_main && (
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  Principal
                </span>
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
                  <div className="font-medium">{format(endDate, "d MMM yyyy", { locale: es })}</div>
                </div>
              </div>
              
              {/* Duration indicator */}
              <div className="text-xs text-muted-foreground text-center">
                {now < startDate ? (
                  `Inicia en ${Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} días`
                ) : now > endDate ? (
                  `Expiró hace ${Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))} días`
                ) : (
                  `Activa por ${Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} días más`
                )}
              </div>
            </div>

            {/* Condition info */}
            <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted/20 rounded">
              <strong>Condición:</strong> {promotion.condition_type === 'category' ? 'Categoría' : 'Tags'} - {promotion.condition_value}
            </div>

            {/* Actions */}
            {!isPublic && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
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
                  
                  {showDuplicate && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicate(promotion);
                            }}
                            disabled={isPending}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicar promoción</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive h-8 w-8 p-0" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(promotion);
                    }}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {isCurrentlyLive && !promotion.is_main && onSetMain && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSetMain(promotion)
                    }}
                    disabled={isPending}
                  >
                    Hacer Principal
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
