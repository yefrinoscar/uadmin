import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

// Skeleton card component for empty state (matches the one from promotions-list.tsx)
function PromotionSkeletonCard({ index, section = "active" }: { index: number, section?: "active" | "other" }) {
  const activeMessages = [
    "Crea tu primera promoción y aparecerá aquí",
    "Las promociones live se mostrarán en esta sección",
    "Aprovecha para crear ofertas especiales"
  ]
  
  const otherMessages = [
    "Las promociones futuras aparecerán aquí",
    "Promociones expiradas se mostrarán en esta sección",
    "Gestiona el ciclo de vida de tus promociones"
  ]
  
  const messages = section === "active" ? activeMessages : otherMessages
  
  const bgGradient = section === "active" 
    ? "bg-gradient-to-br from-green-50/30 to-blue-50/30" 
    : "bg-gradient-to-br from-gray-50/30 to-slate-50/30"
    
  return (
    <Card className={`p-6 opacity-40 border-dashed border-2 hover:opacity-60 transition-opacity duration-200 ${bgGradient}`}>
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="w-20 h-3 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="w-10 h-5 bg-gray-300 rounded-full animate-pulse"></div>
        </div>
        
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="w-3/4 h-5 bg-gray-300 rounded animate-pulse"></div>
          <div className="w-full h-3 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-2/3 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Dates skeleton */}
        <div className="p-3 bg-gray-100/50 rounded-lg space-y-3">
          <div className="flex justify-between">
            <div className="space-y-1">
              <div className="w-8 h-2 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <div className="w-6 h-2 bg-gray-300 rounded animate-pulse"></div>
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-32 h-2 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
        
        {/* Tags skeleton */}
        <div className="p-2 bg-gray-100/30 rounded">
          <div className="w-24 h-2 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Call to action message */}
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground font-medium">
            {messages[index % messages.length]}
          </p>
        </div>
        
        {/* Actions skeleton */}
        <div className="flex justify-between items-center">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </Card>
  )
}

export function PromotionsBoardSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Search skeleton */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Currently Active Promotions section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-8" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <PromotionSkeletonCard key={`active-${index}`} index={index} section="active" />
          ))}
        </div>
      </div>

      {/* Other Promotions section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-8" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 2 }, (_, index) => (
            <PromotionSkeletonCard key={`other-${index}`} index={index} section="other" />
          ))}
        </div>
      </div>
    </div>
  )
} 