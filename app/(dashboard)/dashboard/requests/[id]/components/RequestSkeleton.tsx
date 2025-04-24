import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RequestSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      
      {/* Request Details Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-7 w-64" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <div className="flex flex-col space-y-1.5">
              <Skeleton className="h-6 w-24" /> {/* Card title */}
              <Skeleton className="h-4 w-48" /> {/* Card description */}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14"><Skeleton className="h-4 w-4" /></TableHead>
                  <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                  <TableHead className="w-24 text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableHead>
                  <TableHead className="w-24 text-right"><Skeleton className="h-4 w-10 ml-auto" /></TableHead>
                  <TableHead className="w-16"><Skeleton className="h-4 w-4" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="w-10 h-10 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-5 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-8 h-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between items-center">
            <div className="text-sm">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-48 mt-1" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-md bg-secondary/50" /> {/* Search button - secondary variant */}
              <Skeleton className="h-9 w-28 rounded-md" /> {/* Add button */}
            </div>
          </CardFooter>
        </Card>
        
        {/* Pricing Calculator */}
        <Card className="h-full">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Card>
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
                    <Skeleton className="h-5 w-24 font-bold" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
        
        {/* Response Section */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <Skeleton className="w-full h-[calc(100%-60px)] min-h-[300px] rounded-md" />
          </CardContent>
          <CardFooter className="flex justify-between pt-4">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}