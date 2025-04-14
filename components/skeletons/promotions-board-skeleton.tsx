import { Skeleton } from "@/components/ui/skeleton";

export function PromotionsBoardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Action buttons skeleton */}
      <div className="flex justify-end items-center gap-4">
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Active promotions column */}
        <div className="w-full md:w-1/3">
          <div className="bg-secondary/20 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-6 w-[180px]" />
            </div>

            <div className="min-h-[200px] space-y-6">
              {/* Active promotion cards */}
              {[...Array(2)].map((_, i) => (
                <div key={`active-${i}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-[150px]" />
                      <Skeleton className="h-6 w-[80px]" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-[100px]" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inactive promotions column */}
        <div className="w-full md:w-2/3">
          <div className="bg-background border p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-10 w-[250px]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[200px]">
              {/* Inactive promotion cards */}
              {[...Array(4)].map((_, i) => (
                <div key={`inactive-${i}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-6 w-[130px]" />
                      <Skeleton className="h-6 w-[70px]" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-[100px]" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 