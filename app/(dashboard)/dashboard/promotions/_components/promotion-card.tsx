"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Copy, CircleDashed, Zap } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Promotion } from "@/types/promotion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface PromotionCardProps {
  promotion: Promotion
  isActive: boolean
  isOver?: boolean
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

export function PromotionCard({ 
  promotion, 
  isActive,
  isOver = false,
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
  const isExpired = endDate < new Date()
  const hasStarted = startDate <= new Date()

  return (
    <Card 
      className={cn(
        "transition-all duration-200 overflow-hidden cursor-pointer",
        isActive ? "" : "",
        isOver ? "border-primary border-2 bg-primary/5 scale-105" : "",
        isExpired ? "opacity-70" : "",
        promotion.is_main && ""
      )}
      onClick={onClick}
    >
      {isOver && (
        <div className="bg-primary text-primary-foreground text-xs text-center py-1 font-medium">
          Soltar para reemplazar
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          >
            {promotion.active ? (
              <Zap className="w-6 h-6" />
            ) : (
              <CircleDashed className="w-6 h-6" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {/* Status indicator */}
              <div className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  isExpired ? "bg-red-500" :
                  !hasStarted ? "bg-zinc-400" :
                  "bg-emerald-500"
                )} />
                <span className="text-xs font-medium text-muted-foreground">
                  {isExpired ? "Expirada" : !hasStarted ? "Pendiente" : "Activa"}
                </span>
              </div>
              {promotion.is_main && (
                <span className="bg-underla-50 text-underla-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  Principal
                </span>
              )}
            </div>

            <h3 className="text-base font-semibold mb-1">{promotion.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {promotion.description}
            </p>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 text-sm p-3 bg-muted/10 rounded-lg mb-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Inicio</div>
                <div className="font-medium">{format(startDate, "d 'de' MMMM, yyyy", { locale: es })}</div>
                <div className="text-xs text-muted-foreground">{format(startDate, "HH:mm")}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Fin</div>
                <div className="font-medium">{format(endDate, "d 'de' MMMM, yyyy", { locale: es })}</div>
                <div className="text-xs text-muted-foreground">{format(endDate, "HH:mm")}</div>
              </div>
            </div>

            {/* Actions */}
            {!isPublic && (
              <div className="flex items-center justify-end gap-2">
                {isActive && !isExpired && !promotion.is_main && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-underla text-underla hover:bg-underla hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSetMain?.(promotion)
                    }}
                    disabled={isPending || isExpired}
                  >
                    Hacer Principal
                  </Button>
                )}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(promotion);
                  }}
                  disabled={isPending}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(promotion);
                  }}
                  disabled={isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Only show admin actions if not public */}
      {!isPublic && (
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* ... existing action buttons ... */}
        </div>
      )}
    </Card>
  )
}
