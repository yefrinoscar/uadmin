import { Skeleton } from "@/components/ui/skeleton";

export function CollectionsSkeleton() {
  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Grid matching collections-list.tsx layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="space-y-2">
            {/* Aspect square image skeleton */}
            <Skeleton className="aspect-square rounded-2xl" />
            
            {/* Title */}
            <Skeleton className="h-4 w-3/4" />
            
            {/* Handle */}
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
