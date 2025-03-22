"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import type { Promotion } from "@/types/promotion"

interface PromotionCardProps {
  promotion: Promotion
  isActive: boolean
  isOver?: boolean
  onClick?: () => void
  onEdit: (promotion: Promotion) => void
  onDelete: (promotion: Promotion) => Promise<void>
  isPending: boolean
  isReplacing: boolean
  onSetMain?: (promotion: Promotion) => void
}

export function PromotionCard({ 
  promotion, 
  isActive,
  isOver = false,
  onClick,
  onEdit, 
  onDelete, 
  onSetMain,
  isPending,
}: PromotionCardProps) {
  const startDate = new Date(promotion.start_date)
  const endDate = new Date(promotion.end_date)
  const isExpired = endDate < new Date()
  const hasStarted = startDate <= new Date()

  return (
    <Card 
      className={cn(
        "transition-all duration-200 overflow-hidden cursor-pointer",
        isActive ? "border-primary/50" : "",
        isOver ? "border-primary border-2 bg-primary/5 scale-105" : "",
        isExpired ? "opacity-70" : "",
        promotion.isMain && "ring-2 ring-underla border-underla"
      )}
      style={{
        backgroundColor: promotion.backgroundColor
      }}
      onClick={onClick}
    >
      {isOver && (
        <div className="bg-primary text-primary-foreground text-xs text-center py-1 font-medium">
          Soltar para reemplazar
        </div>
      )}
      <CardHeader className="pb-2 space-y-1">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-bold">{promotion.name}</CardTitle>
            {promotion.isMain && (
              <span className="bg-underla-50 text-underla-700 text-xs px-2 py-1 rounded-full font-medium">
                Principal
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            {isActive && !promotion.isMain && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-underla text-underla hover:bg-underla hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  onSetMain?.(promotion)
                }}
                disabled={isPending || isExpired}
              >
                Hacer Principal
              </Button>
            )}
            <span className={cn(
              "text-xs px-3 py-1 rounded-full font-medium",
              isExpired ? "bg-red-500 text-white" :
              !hasStarted ? "bg-zinc-200 text-zinc-700" :
              "bg-emerald-500 text-white"
            )}>
              {isExpired ? "Expirada" : !hasStarted ? "Pendiente" : "Activa"}
            </span>
          </div>
        </div>
        <CardDescription className="text-sm line-clamp-2">{promotion.title}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">
              {promotion.condition_type === "category" ? "Categoría" : "Tags"}
            </div>
            <div className="text-sm line-clamp-2">
              {promotion.condition_content}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm border rounded-lg p-3 bg-muted/10">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Inicio</div>
              <div className="font-medium">{format(startDate, "d 'de' MMMM, yyyy", { locale: es })}</div>
              <div className="text-xs text-muted-foreground">{format(startDate, "HH:mm")}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(startDate, { locale: es, addSuffix: true })}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1">Fin</div>
              <div className="font-medium">{format(endDate, "d 'de' MMMM, yyyy", { locale: es })}</div>
              <div className="text-xs text-muted-foreground">{format(endDate, "HH:mm")}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(endDate, { locale: es, addSuffix: true })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 pt-2">
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
      </CardFooter>
    </Card>
  )
}
