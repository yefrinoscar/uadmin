"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  CheckSquare, 
  BarChart,
  Trophy
} from "lucide-react"

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount)
}

// Helper function to format percentage
const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`
}

type PeriodType = "current_month" | "last_month" | "current_year" | "all";

export function RequestsKPIs() {
  const [period, setPeriod] = useState<PeriodType>("current_month")
  const trpc = useTRPC()
  
  // Create query options
  const getStatsQueryOptions = trpc.requests.getStats.queryOptions({ period })
  
  // Get requests stats with period filter
  const { data, isLoading } = useQuery(getStatsQueryOptions)
  
  // Get period label
  const getPeriodLabel = () => {
    switch (period) {
      case "current_month":
        return "este mes"
      case "last_month":
        return "el mes pasado"
      case "current_year":
        return "este año"
      case "all":
        return "todo el tiempo"
      default:
        return ""
    }
  }

  // Get top product (if available)
  const getTopProduct = () => {
    if (!data?.topProducts || data.topProducts.length === 0) {
      return { title: "No hay datos", count: 0, profit: 0 }
    }
    return data.topProducts[0]
  }

  const topProduct = getTopProduct()
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight"></h2>
        
        <Tabs
          value={period}
          onValueChange={(value) => setPeriod(value as PeriodType)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="current_month">Este mes</TabsTrigger>
            <TabsTrigger value="last_month">Mes pasado</TabsTrigger>
            <TabsTrigger value="current_year">Este año</TabsTrigger>
            <TabsTrigger value="all">Todo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.totalRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Pedidos {getPeriodLabel()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Completados</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.completedRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Completados {getPeriodLabel()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data?.totalProfit || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Ganancia {getPeriodLabel()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatPercentage(data?.conversionRate || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Conversión {getPeriodLabel()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Media</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data?.avgProfitPerRequest || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Por pedido completado
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Producto más Popular</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <>
                <div className="text-lg font-bold line-clamp-1" title={topProduct.title}>
                  {topProduct.title}
                </div>
                <p className="text-xs text-muted-foreground">
                  {topProduct.count} pedidos / {formatCurrency(topProduct.profit)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 