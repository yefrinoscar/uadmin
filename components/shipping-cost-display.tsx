"use client"

import { usePricingCalculations } from "@/hooks/usePricingCalculations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TruckIcon } from "lucide-react"
import { PricingConstants } from "@/config/pricing-constants"

type ShippingCostDisplayProps = {
  basePrice: number
  weight: number
  className?: string
}

/**
 * A simple component that only uses the shippingCosts and totalUSD from the pricing calculations hook
 */
export function ShippingCostDisplay({
  basePrice,
  weight,
  className
}: ShippingCostDisplayProps) {
  // Use the pricing calculations hook but we only care about shippingCosts and totalUSD
  const { totalCosts, totalUSD } = usePricingCalculations({
    basePrice,
    weight,
    // Use the constant for default exchange rate
    exchangeRate: PricingConstants.DEFAULT_EXCHANGE_RATE
  })

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TruckIcon className="h-5 w-5" />
          <span>Costos de Envío</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Costo de envío:</div>
            <div className="text-sm font-semibold text-right">$ {totalCosts.toFixed(2)}</div>
            
            <div className="text-sm font-medium">Valor del producto:</div>
            <div className="text-sm font-semibold text-right">$ {basePrice.toFixed(2)}</div>
            
            <div className="text-sm font-medium">Peso del paquete:</div>
            <div className="text-sm font-semibold text-right">{weight} kg</div>
            
            <div className="col-span-2 h-px bg-gray-200 my-2"></div>
            
            <div className="text-base font-bold flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              Total:
            </div>
            <div className="text-base font-bold text-right">$ {totalUSD.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
