"use client"

import { useEffect, useState } from "react"
import { InputNumber } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Weight, TrendingUp } from "lucide-react"
import { usePricingCalculations } from "@/hooks/usePricingCalculations"
import { PricingConstants } from "@/config/pricing-constants"

type PricingCalculatorProps = {
  className?: string
  basePrice?: number
  weight?: number
  marginPEN?: number
  taxPercentage?: number
  disabled?: boolean
  onCalculationsChange?: (calculations: {
    totalUSD: number
    totalCosts: number
  }) => void
}

export function PricingCalculator({
  className,
  basePrice = 0,
  weight = 0,
  marginPEN = PricingConstants.DEFAULT_MARGIN_PEN,
  taxPercentage = PricingConstants.DEFAULT_TAX_PERCENTAGE,
  disabled = false,
  onCalculationsChange
}: PricingCalculatorProps) {
  // Local state for form inputs
  const [_basePrice, setBasePrice] = useState(basePrice)
  const [_weight, setWeight] = useState(weight)
  const [_marginPEN, setMarginPEN] = useState(marginPEN)

  // Use our custom hook for all pricing calculations
  const pricing = usePricingCalculations({
    basePrice: _basePrice,
    weight: _weight,
    initialMarginPEN: _marginPEN,
    initialTaxPercentage: taxPercentage
  })

  // Extract just what we need for the parent component
  const { totalUSD, totalCosts } = pricing

  // Update margin PEN when pricing.marginPEN changes
  useEffect(() => {
    if (pricing.marginPEN !== marginPEN) {
      setMarginPEN(pricing.marginPEN)
    }
  }, [pricing.marginPEN])

  // Send only shippingCosts and totalUSD to parent components
  useEffect(() => {
    if (!onCalculationsChange) return;
    const handler = setTimeout(() => {
      onCalculationsChange({
        totalUSD,
        totalCosts
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [totalUSD, totalCosts, onCalculationsChange]);

  // Render component with a clean, modular structure
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle>Calculadora de Precios</CardTitle>
        <CardDescription>
          Calcula el precio final de un producto incluyendo costos de envío,
          impuestos y ganancia.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Input Fields Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Datos del Producto</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Base Price Input */}
              <div className="space-y-2">
                <Label htmlFor="basePrice" className="text-sm font-medium">
                  Precio Base (USD)
                </Label>
                <div className="relative">
                  <InputNumber
                    id="basePrice"
                    type="number"
                    value={_basePrice === 0 ? "" : _basePrice}
                    onChange={(e) => {
                      if (!disabled) {
                        const value = Number(e.target.value);
                        setBasePrice(value);
                      }
                    }}
                    disabled={disabled}
                    className="w-full pr-8"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Equivalente a S/. {(basePrice * pricing.exchangeRate).toFixed(2)} PEN
                </p>
              </div>

              {/* Weight Input */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium">
                  Peso (kg)
                </Label>
                <div className="relative">
                  <InputNumber
                    id="weight"
                    type="number"
                    value={_weight === 0 ? "" : _weight}
                    onChange={(e) => {
                      if (!disabled) {
                        const value = Number(e.target.value);
                        setWeight(value);
                      }
                    }}
                    disabled={disabled}
                    className="w-full pr-8"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Weight className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Costo de envío: ${pricing.shipping.toFixed(2)} USD
                </p>
              </div>

              {/* Profit Margin Input */}
              {!disabled && (
                <div className="space-y-2">
                  <Label htmlFor="marginPEN" className="text-sm font-medium">
                    Ganancia (PEN)
                  </Label>
                  <div className="relative">
                    <InputNumber
                      id="marginPEN"
                      type="number"
                      value={_marginPEN}
                      onChange={(e) => {
                        if (!disabled) {
                          const value = Number(e.target.value);
                          setMarginPEN(value);
                          pricing.setMarginPEN(value);
                        }
                      }}
                      disabled={disabled}
                      className="w-full pr-8"
                      step="1"
                      min="0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Equivalente a ${(marginPEN / pricing.exchangeRate).toFixed(2)} USD
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Price Summary Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Resumen de Precios</h3>
            <div className="space-y-4">
              {/* USD Costs */}
              <div className="space-y-2">
                {/* Product Value */}
                <div className="flex justify-between">
                  <span className="text-sm">Valor del producto:</span>
                  <span className="text-sm font-medium">${_basePrice.toFixed(2)}</span>
                </div>

                {/* Shipping Cost */}
                <div className="flex justify-between">
                  <span className="text-sm">Envío:</span>
                  <span className="text-sm font-medium">${pricing.shipping.toFixed(2)}</span>
                </div>

                {/* Processing Fee */}
                <div className="flex justify-between">
                  <span className="text-sm">Tramitación:</span>
                  <span className="text-sm font-medium">${pricing.processing.toFixed(2)}</span>
                </div>

                {/* Mobility Fee */}
                <div className="flex justify-between">
                  <span className="text-sm">Movilidad:</span>
                  <span className="text-sm font-medium">${pricing.mobility.toFixed(2)}</span>
                </div>

                {/* Tax Information */}
                {!disabled && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm">Impuesto ({pricing.taxPercentage}%):</span>
                      <span className="text-sm font-medium">${pricing.taxAmount.toFixed(2)}</span>
                    </div>
                    {pricing.hasImportTax && (
                      <div className="flex justify-between">
                        <span className="text-sm">Imp. importación (22%):</span>
                        <span className="text-sm font-medium">${pricing.importTax.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}


              </div>

              <Separator />

              {/* Totals Section */}
              <div className="grid grid-cols-2 gap-4">
                {/* USD Total */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-base font-bold">Total:</span>
                    <span className="text-base font-bold">${totalUSD.toFixed(2)}</span>
                  </div>

                  {/* USD Profit - Conditional */}
                  {!disabled && (
                    <div className="flex justify-between">
                      <span className="text-sm">Ganancia:</span>
                      <span className="text-sm font-medium">${(marginPEN / pricing.exchangeRate).toFixed(2)}</span>
                    </div>
                  )}

                  {/* Total USD with Profit - Conditional */}
                  {!disabled && (
                    <div className="flex justify-between pt-1 border-t mt-1">
                      <span className="text-base font-bold">Total con ganancia:</span>
                      <span className="text-base font-bold">${pricing.totalWithPENMargin.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* PEN Total */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-base font-bold">Total:</span>
                    <span className="text-base font-bold">S/. {pricing.totalPEN.toFixed(2)}</span>
                  </div>

                  {/* PEN Profit - Conditional */}
                  {!disabled && (
                    <div className="flex justify-between">
                      <span className="text-sm">Ganancia:</span>
                      <span className="text-sm font-medium">S/. {pricing.marginPEN.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Total PEN with Profit - Conditional */}
                  {!disabled && (
                    <div className="flex justify-between pt-1 border-t mt-1">
                      <span className="text-base font-bold">Total con ganancia:</span>
                      <span className="text-base font-bold">S/. {pricing.totalPENWithMargin.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Exchange Rate Info */}
              <div className="text-xs text-muted-foreground text-center">
                Tipo de cambio: ${1} = S/. {pricing.exchangeRate}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}