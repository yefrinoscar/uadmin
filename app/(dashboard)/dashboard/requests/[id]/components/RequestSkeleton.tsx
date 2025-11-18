import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RequestSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header with back button and action buttons */}
      <div className="flex justify-between items-start">
        <div className="flex space-x-2 items-center">
          <Skeleton className="h-9 w-9 rounded-md" /> {/* Back button */}
          <Skeleton className="h-8 w-48" /> {/* Title */}
        </div>
        <div className="flex space-x-3 items-center">
          <Skeleton className="h-9 w-32 rounded-md" /> {/* Cancel button */}
          <Skeleton className="h-9 w-36 rounded-md" /> {/* Save button */}
          <Skeleton className="h-9 w-28 rounded-md" /> {/* Preview button */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Workflow Skeleton */}
          <div className="bg-muted/30 rounded-lg p-3.5 border border-border/50">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  {i < 4 && (
                    <div className="flex-1 px-2">
                      <Skeleton className="h-[2px] w-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Request Details Card Skeleton */}
          <Card>
            <CardContent className="text-sm grid grid-cols-2">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 col-span-1">
                <Skeleton className="h-4 w-28" /> {/* ID Label */}
                <Skeleton className="h-5 w-24" /> {/* ID Value */}
                
                <Skeleton className="h-4 w-28" /> {/* Description Label */}
                <Skeleton className="h-5 w-48" /> {/* Description Value */}
                
                <Skeleton className="h-4 w-28" /> {/* Status Label */}
                <Skeleton className="h-6 w-24 rounded-full" /> {/* Status Badge */}
                
                <Skeleton className="h-4 w-28" /> {/* Client Name Label */}
                <Skeleton className="h-5 w-40" /> {/* Client Name Value */}
              </div>
              
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 col-span-1">
                <Skeleton className="h-4 w-32" /> {/* Email Label */}
                <Skeleton className="h-5 w-44" /> {/* Email Value */}
                
                <Skeleton className="h-4 w-32" /> {/* Phone Label */}
                <Skeleton className="h-5 w-32" /> {/* Phone Value */}
                
                <Skeleton className="h-4 w-20" /> {/* Created Label */}
                <Skeleton className="h-5 w-36" /> {/* Created Value */}
                
                <Skeleton className="h-4 w-24" /> {/* Updated Label */}
                <Skeleton className="h-5 w-36" /> {/* Updated Value */}
              </div>
            </CardContent>
          </Card>

          {/* Product List Skeleton */}
          <Card className="py-0">
            <CardContent className="p-0">
              <ScrollArea className="min-h-[200px]">
                <Table>
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-b border-border">
                      <TableHead className="py-2 px-3 w-[60px]">
                        <div className="flex justify-center">
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </TableHead>
                      <TableHead className="py-2 px-3">
                        <Skeleton className="h-4 w-16" />
                      </TableHead>
                      <TableHead className="py-2 px-3">
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                      <TableHead className="py-2 px-3">
                        <Skeleton className="h-4 w-16" />
                      </TableHead>
                      <TableHead className="py-2 px-3">
                        <Skeleton className="h-4 w-14" />
                      </TableHead>
                      <TableHead className="py-2 px-3">
                        <Skeleton className="h-4 w-20" />
                      </TableHead>
                      <TableHead className="py-2 px-3">
                        <Skeleton className="h-4 w-12" />
                      </TableHead>
                      <TableHead className="py-2 px-3 w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(3)].map((_, i) => (
                      <TableRow key={i} className="border-b border-border">
                        <TableCell className="py-2 px-3">
                          <div className="flex justify-center">
                            <Skeleton className="w-8 h-8 rounded-md" />
                          </div>
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Skeleton className="h-5 w-12" />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="py-2 px-3">
                          <div className="flex gap-2 justify-end">
                            <Skeleton className="w-8 h-8 rounded-full" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right column - 1/3 width - Total Summary Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="space-y-4">
              {/* Currency selector */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Exchange rate */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Final price */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Summary breakdown */}
              <div className="space-y-3 pt-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
                <div className="border-t pt-3 mt-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}