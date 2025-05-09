"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SalesChartsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Estadísticas de Ventas</h2>
        <Skeleton className="h-10 w-[180px]" />
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-4 w-[140px] mt-1" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-4 w-[140px] mt-1" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-4 w-[140px] mt-1" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Real</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-[100px]" />
            <Skeleton className="h-4 w-[140px] mt-1" />
          </CardContent>
        </Card>
      </div>
      
      {/* Chart Skeleton */}
      <Card className="col-span-4">
        <CardHeader>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" disabled>Resumen</TabsTrigger>
              <TabsTrigger value="status" disabled>Por Estado</TabsTrigger>
              <TabsTrigger value="profit" disabled>Ganancias</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-6">
          <div className="w-full h-[350px] flex items-center justify-center">
            <Skeleton className="h-[350px] w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
