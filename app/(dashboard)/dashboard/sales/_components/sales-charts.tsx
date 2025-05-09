/* eslint-disable */

"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTRPC } from "@/trpc/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react"
import { 
  CartesianGrid, 
  Line, 
  LineChart, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts"

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(amount)
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label, valuePrefix = "" }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-md shadow-md p-3">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {valuePrefix}{entry.value.toLocaleString('es-PE')}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Status color mapping
const STATUS_COLORS = {
  ACTIVE: "hsl(var(--success))",
  INACTIVE: "hsl(var(--muted-foreground))",
  SOLD: "hsl(var(--primary))",
  RESERVED: "hsl(var(--warning))",
}

// Generate sample data based on period
const generateChartData = (period: string) => {
  const now = new Date()
  let data = []
  
  if (period === "current_month" || period === "last_month") {
    // Generate daily data for a month
    const daysInMonth = 30
    for (let i = 1; i <= daysInMonth; i++) {
      const day = i < 10 ? `0${i}` : `${i}`
      data.push({
        date: day,
        sales: Math.floor(Math.random() * 5) + 1,
        revenue: Math.round((Math.random() * 1000) + 500),
        profit: Math.round(((Math.random() * 1000) + 500) * 0.3),
      })
    }
  } else if (period === "current_year") {
    // Generate monthly data for a year
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    data = months.map(month => ({
      date: month,
      sales: Math.floor(Math.random() * 20) + 5,
      revenue: Math.round((Math.random() * 5000) + 1000),
      profit: Math.round(((Math.random() * 5000) + 1000) * 0.3),
    }))
  } else {
    // Generate yearly data
    const currentYear = now.getFullYear()
    for (let i = 0; i < 5; i++) {
      const year = currentYear - 4 + i
      data.push({
        date: year.toString(),
        sales: Math.floor(Math.random() * 50) + 20 + (i * 10),
        revenue: Math.round((Math.random() * 10000) + 5000 + (i * 2000)),
        profit: Math.round(((Math.random() * 10000) + 5000 + (i * 2000)) * 0.3),
      })
    }
  }
  
  return data
}

// Generate status data
const generateStatusData = () => {
  return [
    { name: "Activo", value: Math.floor(Math.random() * 20) + 10, color: STATUS_COLORS.ACTIVE },
    { name: "Inactivo", value: Math.floor(Math.random() * 15) + 5, color: STATUS_COLORS.INACTIVE },
    { name: "Vendido", value: Math.floor(Math.random() * 30) + 20, color: STATUS_COLORS.SOLD },
    { name: "Reservado", value: Math.floor(Math.random() * 10) + 5, color: STATUS_COLORS.RESERVED },
  ]
}

export function SalesCharts() {
  const [period, setPeriod] = useState<"current_month" | "last_month" | "current_year" | "all">("current_month")
  const trpc = useTRPC()
  
  // Create query options
  const getStatsQueryOptions = trpc.sales.getStats.queryOptions({ period })
  
  // Get sales stats with period filter
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
  
  // Get period date range for chart description
  const getPeriodDateRange = () => {
    const now = new Date()
    
    switch (period) {
      case "current_month": {
        const month = now.toLocaleString('es', { month: 'long' })
        const year = now.getFullYear()
        return `${month} ${year}`
      }
      case "last_month": {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
        const month = lastMonth.toLocaleString('es', { month: 'long' })
        const year = lastMonth.getFullYear()
        return `${month} ${year}`
      }
      case "current_year":
        return `${now.getFullYear()}`
      case "all":
        return "Histórico"
      default:
        return ""
    }
  }
  
  // Calculate trend percentage (random for demo)
  const getTrendPercentage = () => {
    return (Math.random() * 10 - 5).toFixed(1)
  }
  
  // Chart data
  const chartData = generateChartData(period)
  const statusData = generateStatusData()
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Estadísticas de Ventas</h2>
        
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(value: any) => setPeriod(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Este mes</SelectItem>
              <SelectItem value="last_month">Mes pasado</SelectItem>
              <SelectItem value="current_year">Este año</SelectItem>
              <SelectItem value="all">Todo el tiempo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{data?.totalSales || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Ventas {getPeriodLabel()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Ingresos {getPeriodLabel()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganancia</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Ganancia Real</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-[100px]" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${(data?.totalRealProfit || 0) < 0 ? "text-red-500" : "text-green-500"}`}>
                  {formatCurrency(data?.totalRealProfit || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ganancia neta {getPeriodLabel()}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas</CardTitle>
            <CardDescription>{getPeriodDateRange()}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Ventas"
                    stroke="hsl(var(--primary))"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              {parseFloat(getTrendPercentage()) > 0 ? (
                <>Incremento de {getTrendPercentage()}% {getPeriodLabel()} <TrendingUp className="h-4 w-4 text-green-500" /></>
              ) : (
                <>Disminución de {getTrendPercentage().replace('-', '')}% {getPeriodLabel()} <TrendingDown className="h-4 w-4 text-red-500" /></>
              )}
            </div>
            <div className="leading-none text-muted-foreground">
              Mostrando ventas totales {getPeriodLabel()}
            </div>
          </CardFooter>
        </Card>
        
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ingresos</CardTitle>
            <CardDescription>{getPeriodDateRange()}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip valuePrefix="S/ " />} />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Ingresos" 
                    fill="hsl(var(--success))" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              {parseFloat(getTrendPercentage()) > 0 ? (
                <>Incremento de {getTrendPercentage()}% {getPeriodLabel()} <TrendingUp className="h-4 w-4 text-green-500" /></>
              ) : (
                <>Disminución de {getTrendPercentage().replace('-', '')}% {getPeriodLabel()} <TrendingDown className="h-4 w-4 text-red-500" /></>
              )}
            </div>
            <div className="leading-none text-muted-foreground">
              Mostrando ingresos totales {getPeriodLabel()}
            </div>
          </CardFooter>
        </Card>
        
        {/* Profit Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ganancia</CardTitle>
            <CardDescription>{getPeriodDateRange()}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip valuePrefix="S/ " />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Ganancia"
                    stroke="hsl(var(--warning))"
                    fill="hsl(var(--warning))"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 font-medium leading-none">
              {parseFloat(getTrendPercentage()) > 0 ? (
                <>Incremento de {getTrendPercentage()}% {getPeriodLabel()} <TrendingUp className="h-4 w-4 text-green-500" /></>
              ) : (
                <>Disminución de {getTrendPercentage().replace('-', '')}% {getPeriodLabel()} <TrendingDown className="h-4 w-4 text-red-500" /></>
              )}
            </div>
            <div className="leading-none text-muted-foreground">
              Mostrando ganancias totales {getPeriodLabel()}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
