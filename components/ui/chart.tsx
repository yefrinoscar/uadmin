"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ChartConfig {
  [key: string]: {
    label: string
    color?: string
  }
}

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | undefined>(
  undefined
)

function useChartContext() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChartContext must be used within a ChartProvider")
  }
  return context
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactNode
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  const createGradients = Object.keys(config).map((key) => {
    if (!config[key].color) return null
    
    const color = config[key].color!
    
    // Define style variables for colors
    const style = document.createElement("style")
    style.innerHTML = `
      :root {
        --color-${key}: ${color};
      }
    `
    document.head.appendChild(style)
    
    return style
  })
  
  React.useEffect(() => {
    return () => {
      createGradients.forEach(style => {
        if (style) document.head.removeChild(style)
      })
    }
  }, [createGradients])

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn("relative h-full w-full", className)}
        {...props}
      >
        {children}
      </div>
    </ChartContext.Provider>
  )
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{
    value: number
    name: string
    color: string
    dataKey: string
  }>
  label?: string
  labelFormatter?: (value: string) => string
  formatter?: (value: number, name: string) => React.ReactNode
  valueFormatter?: (value: number) => string
  indicator?: "line" | "dot"
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  valueFormatter = (value) => value.toString(),
  indicator = "line",
}: ChartTooltipContentProps) {
  const { config } = useChartContext()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="font-medium">
        {labelFormatter ? labelFormatter(label!) : label}
      </div>
      <div className="grid gap-0.5 pt-1">
        {payload.map((item, index) => (
          <div
            key={`item-${index}`}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="flex items-center gap-1">
              {indicator === "line" ? (
                <div
                  className="h-[3px] w-4"
                  style={{ backgroundColor: item.color }}
                />
              ) : (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-muted-foreground">
                {formatter
                  ? formatter(item.value, config[item.dataKey]?.label || item.name)
                  : config[item.dataKey]?.label || item.name}
              </span>
            </div>
            <span className="font-medium">
              {formatter
                ? formatter(item.value, config[item.dataKey]?.label || item.name)
                : valueFormatter(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ChartLegendContentProps {
  payload?: Array<{
    value: string
    color: string
    dataKey: string
  }>
}

export function ChartLegendContent({ payload }: ChartLegendContentProps) {
  const { config } = useChartContext()

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {payload?.map((item, index) => (
        <div key={`item-${index}`} className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">
            {config[item.dataKey]?.label || item.value}
          </span>
        </div>
      ))}
    </div>
  )
} 