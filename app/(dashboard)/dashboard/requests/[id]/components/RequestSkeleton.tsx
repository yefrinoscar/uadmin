import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

export function RequestSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with back button and action buttons */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" /> {/* Back button */}
          <Skeleton className="h-8 w-64" /> {/* Title */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32 rounded-md" /> {/* Status dropdown */}
          <Skeleton className="h-9 w-28 rounded-md" /> {/* Email button */}
          <Skeleton className="h-9 w-28 rounded-md" /> {/* Save button */}
          <Skeleton className="h-9 w-10 rounded-md" /> {/* View button */}
        </div>
      </div>
      
      {/* Request Details Card */}
      <Card>
        <CardContent className="text-sm grid grid-cols-2 p-6">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 col-span-1">
            <Skeleton className="h-4 w-24" /> {/* ID Label */}
            <Skeleton className="h-5 w-32" /> {/* ID Value */}
            
            <Skeleton className="h-4 w-24" /> {/* Description Label */}
            <Skeleton className="h-5 w-64" /> {/* Description Value */}
            
            <Skeleton className="h-4 w-24" /> {/* Status Label */}
            <Skeleton className="h-6 w-28 rounded-full" /> {/* Status Badge */}
            
            <Skeleton className="h-4 w-24" /> {/* Client Name Label */}
            <Skeleton className="h-5 w-48" /> {/* Client Name Value */}
          </div>
          
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 col-span-1">
            <Skeleton className="h-4 w-24" /> {/* Email Label */}
            <Skeleton className="h-5 w-48" /> {/* Email Value */}
            
            <Skeleton className="h-4 w-24" /> {/* Phone Label */}
            <Skeleton className="h-5 w-36" /> {/* Phone Value */}
            
            <Skeleton className="h-4 w-24" /> {/* Created Label */}
            <Skeleton className="h-5 w-40" /> {/* Created Value */}
            
            <Skeleton className="h-4 w-24" /> {/* Updated Label */}
            <Skeleton className="h-5 w-40" /> {/* Updated Value */}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List - Left side (spans 2 columns) */}
        <div className="lg:col-span-2">
          <Card className="border shadow-md py-0 h-full">
            <CardHeader className="px-6 py-4 border-b">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Skeleton className="h-6 w-32" /> {/* Products title */}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14"><Skeleton className="h-4 w-4" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                      <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                      <TableHead className="w-24 text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableHead>
                      <TableHead className="w-24 text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableHead>
                      <TableHead className="w-16"><Skeleton className="h-4 w-4" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(4)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="w-10 h-10 rounded-md" />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-5 w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-5 w-16 ml-auto" />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Skeleton className="w-8 h-8 rounded-md" />
                            <Skeleton className="w-8 h-8 rounded-md" />
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
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-48 mt-1" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9 rounded-md bg-secondary/50" /> {/* Search button */}
                <Skeleton className="h-9 w-28 rounded-md" /> {/* Add button */}
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Total Summary Card - Right side */}
        <Card className="h-full">
          <CardHeader className="px-6 py-4 border-b">
            <CardTitle className="text-lg font-semibold">
              <Skeleton className="h-6 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t mt-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end mt-4">
              <Skeleton className="h-9 w-32 rounded-md" /> {/* Calculator button */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}