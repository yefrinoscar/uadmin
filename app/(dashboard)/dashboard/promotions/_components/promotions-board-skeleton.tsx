import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function PromotionsBoardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center gap-4">
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Active promotions section */}
        <div className="w-full md:w-1/3">
          <div className="bg-secondary/20 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-10" />
            </div>
            
            <div className="min-h-[200px] space-y-6">
              {/* Active promotion cards */}
              {Array.from({ length: 2 }).map((_, i) => (
                <PromotionCardSkeleton key={`active-${i}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Inactive promotions section */}
        <div className="w-full md:w-2/3">
          <div className="bg-background border p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-9 w-64 rounded-md" />
            </div>
            
            <div className={cn(
              "grid grid-cols-1 md:grid-cols-2 gap-6",
              "min-h-[200px]"
            )}>
              {Array.from({ length: 4 }).map((_, i) => (
                <PromotionCardSkeleton key={`inactive-${i}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PromotionCardSkeleton() {
  return (
    <div className="bg-card rounded-lg p-4 border shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="space-y-2 mt-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-8 w-20" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  )
} 