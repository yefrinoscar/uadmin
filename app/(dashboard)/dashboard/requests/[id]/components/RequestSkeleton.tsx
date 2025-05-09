import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Custom animated skeleton component with better animation
function AnimatedSkeleton({ className, ...props }: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      className={cn(
        "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function RequestSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with back button and action buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AnimatedSkeleton className="h-9 w-9 rounded-md" /> {/* Back button */}
          <AnimatedSkeleton className="h-8 w-64" /> {/* Title */}
        </div>
        <div className="flex gap-2">
          <AnimatedSkeleton className="h-9 w-32 rounded-md" /> {/* Status dropdown */}
          <AnimatedSkeleton className="h-9 w-28 rounded-md" /> {/* Email button */}
          <AnimatedSkeleton className="h-9 w-28 rounded-md" /> {/* Save button */}
          <AnimatedSkeleton className="h-9 w-10 rounded-md" /> {/* View button */}
        </div>
      </div>
      
      {/* Request Details Card */}
      <Card>
        <CardContent className="text-sm grid grid-cols-2 p-6">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 col-span-1">
            <AnimatedSkeleton className="h-4 w-24" /> {/* ID Label */}
            <AnimatedSkeleton className="h-5 w-32" /> {/* ID Value */}
            
            <AnimatedSkeleton className="h-4 w-24" /> {/* Description Label */}
            <AnimatedSkeleton className="h-5 w-64" /> {/* Description Value */}
            
            <AnimatedSkeleton className="h-4 w-24" /> {/* Status Label */}
            <AnimatedSkeleton className="h-6 w-28 rounded-full" /> {/* Status Badge */}
            
            <AnimatedSkeleton className="h-4 w-24" /> {/* Client Name Label */}
            <AnimatedSkeleton className="h-5 w-48" /> {/* Client Name Value */}
          </div>
          
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 col-span-1">
            <AnimatedSkeleton className="h-4 w-24" /> {/* Email Label */}
            <AnimatedSkeleton className="h-5 w-48" /> {/* Email Value */}
            
            <AnimatedSkeleton className="h-4 w-24" /> {/* Phone Label */}
            <AnimatedSkeleton className="h-5 w-36" /> {/* Phone Value */}
            
            <AnimatedSkeleton className="h-4 w-24" /> {/* Created Label */}
            <AnimatedSkeleton className="h-5 w-40" /> {/* Created Value */}
            
            <AnimatedSkeleton className="h-4 w-24" /> {/* Updated Label */}
            <AnimatedSkeleton className="h-5 w-40" /> {/* Updated Value */}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List - Left side (spans 2 columns) */}
        <div className="lg:col-span-2">
          <Card className="border shadow-md py-0 h-full">
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle className="text-lg font-semibold flex items-center">
                <AnimatedSkeleton className="h-6 w-32" /> {/* Products title */}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14"><AnimatedSkeleton className="h-4 w-4" /></TableHead>
                      <TableHead><AnimatedSkeleton className="h-4 w-24" /></TableHead>
                      <TableHead><AnimatedSkeleton className="h-4 w-16" /></TableHead>
                      <TableHead className="w-24 text-right"><AnimatedSkeleton className="h-4 w-14 ml-auto" /></TableHead>
                      <TableHead className="w-24 text-right"><AnimatedSkeleton className="h-4 w-14 ml-auto" /></TableHead>
                      <TableHead className="w-16"><AnimatedSkeleton className="h-4 w-4" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(4)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <AnimatedSkeleton className="w-10 h-10 rounded-md" />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <AnimatedSkeleton className="h-5 w-32" />
                            <AnimatedSkeleton className="h-4 w-16 rounded-full" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <AnimatedSkeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="text-right">
                          <AnimatedSkeleton className="h-5 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <AnimatedSkeleton className="h-5 w-16 ml-auto" />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <AnimatedSkeleton className="w-8 h-8 rounded-md" />
                            <AnimatedSkeleton className="w-8 h-8 rounded-md" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between items-center">
              <div className="text-sm">
                <AnimatedSkeleton className="h-5 w-28" />
                <AnimatedSkeleton className="h-4 w-48 mt-1" />
              </div>
              <div className="flex gap-2">
                <AnimatedSkeleton className="h-9 w-9 rounded-md bg-secondary/50" /> {/* Search button */}
                <AnimatedSkeleton className="h-9 w-28 rounded-md" /> {/* Add button */}
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Total Summary Card - Right side */}
        <Card className="h-full">
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-lg font-semibold">
              <AnimatedSkeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <AnimatedSkeleton className="h-4 w-24" />
              <AnimatedSkeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <AnimatedSkeleton className="h-4 w-32" />
              <AnimatedSkeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <AnimatedSkeleton className="h-4 w-28" />
              <AnimatedSkeleton className="h-10 w-full rounded-md" />
            </div>
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <AnimatedSkeleton className="h-4 w-32" />
                      <AnimatedSkeleton className="h-4 w-20" />
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <AnimatedSkeleton className="h-5 w-20" />
                    <AnimatedSkeleton className="h-5 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end mt-4">
              <AnimatedSkeleton className="h-9 w-32 rounded-md" /> {/* Calculator button */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}