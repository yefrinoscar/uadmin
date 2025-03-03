"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Percent } from "lucide-react"

type PricingCalculatorProps = {
  basePrice: number
  onBasePriceChange: (price: number) => void
  className?: string
  onCalculationsChange?: (calculations: {
    totalUSD: number
    totalPEN: number
    exchangeRate: number
  }) => void
}

export function PricingCalculator({ 
  basePrice, 
  onBasePriceChange, 
  className,
  onCalculationsChange 
}: PricingCalculatorProps) {
  const [exchangeRate, setExchangeRate] = useState(3.7)
  const [shippingFixed] = useState(14) // Fixed $14 value for shipping
  const [mobilityFixed] = useState(5) // Fixed $5 value for mobility
  const [taxPercentage] = useState(7) // Changed to 7%
  const [marginPercentage, setMarginPercentage] = useState(10)
  const [marginPEN, setMarginPEN] = useState(0)
  const [isMarginPercentage, setIsMarginPercentage] = useState(true)

  useEffect(() => {
    setIsMarginPercentage(basePrice <= 50)
  }, [basePrice])

  const calculatePrice = useCallback(() => {
    const shipping = shippingFixed
    const tax = basePrice * (taxPercentage / 100)
    const mobility = mobilityFixed
    const margin = isMarginPercentage ? basePrice * (marginPercentage / 100) : 0
    return basePrice + shipping + tax + mobility + margin
  }, [basePrice, shippingFixed, taxPercentage, mobilityFixed, isMarginPercentage, marginPercentage]);

  const calculateTotalWithPENMargin = useCallback(() => {
    const usdTotal = calculatePrice()
    if (!isMarginPercentage) {
      return usdTotal + (marginPEN / exchangeRate)
    }
    return usdTotal
  }, [calculatePrice, isMarginPercentage, marginPEN, exchangeRate]);

  useEffect(() => {
    if (onCalculationsChange) {
      const totalUSD = calculateTotalWithPENMargin()
      onCalculationsChange({
        totalUSD,
        totalPEN: totalUSD * exchangeRate,
        exchangeRate
      })
    }
  }, [exchangeRate, calculateTotalWithPENMargin, onCalculationsChange])

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium">Cálculo de Precios</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="basePrice" className="text-sm font-medium">
            Precio Base (USD)
          </Label>
          <div className="relative">
            <Input
              id="basePrice"
              type="number"
              value={basePrice === 0 ? "" : basePrice}
              onChange={(e) => onBasePriceChange(e.target.value === "" ? 0 : Number(e.target.value))}
              className="w-full pr-8"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shipping" className="text-sm font-medium">
            Envío y Tramitación
          </Label>
          <div className="relative">
            <Input
              id="shipping"
              type="number"
              value={shippingFixed}
              disabled
              className="w-full pr-8 opacity-70"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobility" className="text-sm font-medium">
            Movilidad (fijo)
          </Label>
          <div className="relative">
            <Input
              id="mobility"
              type="number"
              value={mobilityFixed}
              disabled
              className="w-full pr-8 opacity-70"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tax" className="text-sm font-medium">
            Impuesto
          </Label>
          <div className="relative">
            <Input
              id="tax"
              type="number"
              value={taxPercentage}
              disabled
              className="w-full pr-8 opacity-70"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Percent className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="margin" className="text-sm font-medium">
            Ganancia {isMarginPercentage ? '(%)' : '(PEN)'}
          </Label>
          <div className="relative">
            <Input
              id="margin"
              type="number"
              value={isMarginPercentage ? marginPercentage : marginPEN}
              onChange={(e) => 
                isMarginPercentage 
                  ? setMarginPercentage(Number(e.target.value))
                  : setMarginPEN(Number(e.target.value))
              }
              className="w-full pr-8"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {isMarginPercentage ? (
                <Percent className="h-4 w-4 text-gray-500" />
              ) : (
                <span className="text-sm text-gray-500">S/.</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exchangeRate" className="text-sm font-medium">
            Tipo de Cambio
          </Label>
          <Input
            id="exchangeRate"
            type="number"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(Number(e.target.value))}
            className="w-full"
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Resumen de Precios</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Valor del producto:</div>
              <div className="text-sm text-right">$ {basePrice.toFixed(2)}</div>
              <div className="text-sm font-medium">Envío y Tramitación:</div>
              <div className="text-sm text-right">$ {shippingFixed.toFixed(2)}</div>
              <div className="text-sm font-medium">Impuesto ({taxPercentage}%):</div>
              <div className="text-sm text-right">$ {(basePrice * (taxPercentage / 100)).toFixed(2)}</div>
              <div className="text-sm font-medium">Movilidad (fijo):</div>
              <div className="text-sm text-right">$ {mobilityFixed.toFixed(2)}</div>
              {isMarginPercentage ? (
                <>
                  <div className="text-sm font-medium">Ganancia ({marginPercentage}%):</div>
                  <div className="text-sm text-right">$ {(basePrice * (marginPercentage / 100)).toFixed(2)}</div>
                </>
              ) : null}

              <Separator className="col-span-2 my-2" />

              <div className="text-base font-bold">Total USD:</div>
              <div className="text-base font-bold text-right">$ {calculatePrice().toFixed(2)}</div>

              {!isMarginPercentage ? (
                <>
                  <div className="text-base font-bold pt-1">Total PEN (TC: {exchangeRate}):</div>
                  <div className="text-base font-bold text-right pt-1">
                    S/. {(calculatePrice() * exchangeRate).toFixed(2)}
                  </div>
                  <div className="text-sm font-medium">Ganancia (PEN):</div>
                  <div className="text-sm text-right">S/. {marginPEN.toFixed(2)}</div>
                  <div className="text-base font-bold pt-1 border-t mt-1">Total PEN con ganancia:</div>
                  <div className="text-base font-bold text-right pt-1 border-t mt-1">
                    S/. {((calculatePrice() * exchangeRate) + parseFloat(marginPEN.toFixed(2))).toFixed(2)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-base font-bold pt-1">Total PEN (TC: {exchangeRate}):</div>
                  <div className="text-base font-bold text-right pt-1">
                    S/. {(calculatePrice() * exchangeRate).toFixed(2)}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 