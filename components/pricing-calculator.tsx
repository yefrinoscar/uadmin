"use client"

import { useState, useEffect, useCallback } from "react"
import { Input, InputNumber } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Percent, Weight } from "lucide-react"
import { useRequestDetailStore } from "@/store/requestDetailStore"

type PricingCalculatorProps = {
  className?: string
  disabled?: boolean
  onCalculationsChange?: (calculations: {
    totalUSD: number
    totalPEN: number
    exchangeRate: number
    weight: number
  }) => void
}

export function PricingCalculator({
  className,
  disabled = false,
  onCalculationsChange
}: PricingCalculatorProps) {
  const [exchangeRate, setExchangeRate] = useState(3.7)
  const { basePrice, weight, setWeight, setBasePrice } = useRequestDetailStore()

  // Shipping: default $7 if no weight, else weight * 7. Tramitación and movilidad are fixed.
  const shipping = !weight || weight < 1 ? 7 : weight * 7;
  const processing = 7;
  const mobility = 5;
  const [taxPercentage] = useState(7) // Changed to 7%
  const [marginPercentage, setMarginPercentage] = useState(10)
  const [marginPEN, setMarginPEN] = useState(0)
  const [isMarginPercentage, setIsMarginPercentage] = useState(true)

  // Calculate import tax (only applies if base price > $200)
  const importTaxPercentage = 22; // 22% for import tax + 7% additional tax
  const hasImportTax = basePrice > 200;
  const importTax = hasImportTax ? (basePrice + (basePrice * (taxPercentage / 100))) * (importTaxPercentage / 100) : 0;

  useEffect(() => {
    setIsMarginPercentage(basePrice <= 50)
  }, [basePrice])

  const calculatePrice = useCallback(() => {
    const tax = basePrice * (taxPercentage / 100)
    const margin = isMarginPercentage ? basePrice * (marginPercentage / 100) : 0
    return basePrice + shipping + tax + processing + mobility + margin + (hasImportTax ? importTax : 0)
  }, [basePrice, shipping, taxPercentage, processing, mobility, isMarginPercentage, marginPercentage, hasImportTax, importTax]);

  const calculateTotalWithPENMargin = useCallback(() => {
    const usdTotal = calculatePrice()
    if (!isMarginPercentage) {
      return usdTotal + (marginPEN / exchangeRate)
    }
    return usdTotal
  }, [calculatePrice, isMarginPercentage, marginPEN, exchangeRate]);

  useEffect(() => {
    if (!onCalculationsChange) return;
    const handler = setTimeout(() => {
      const totalUSD = calculateTotalWithPENMargin();
      onCalculationsChange({
        totalUSD,
        totalPEN: totalUSD * exchangeRate,
        exchangeRate,
        weight
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [exchangeRate, calculateTotalWithPENMargin, onCalculationsChange, weight, shipping, mobility]);

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium">Cálculo de Precios</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="basePrice" className="text-sm font-medium">
            Precio Base (USD)
          </Label>
          <div className="relative">
            <InputNumber
              id="basePrice"
              type="number"
              value={basePrice === 0 ? "" : basePrice}
              onChange={(e) => {
                if (!disabled) {
                  setBasePrice(Number(e.target.value));
                }
              }} 
              disabled={disabled}
              className="w-full pr-8 opacity-70"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight" className="text-sm font-medium">
            Peso (kg)
          </Label>
          <div className="relative">
            <InputNumber
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => {
                if (!disabled) {
                  setWeight(Number(e.target.value));
                }
              }}
              disabled={disabled}
              className={`w-full pr-8 ${disabled ? 'opacity-70' : ''}`}
              step="0.01"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Weight className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shipping" className="text-sm font-medium">
            Envío (USD)
          </Label>
          <div className="relative">
            <InputNumber
              id="shipping"
              type="number"
              value={shipping}
              disabled
              className="w-full pr-8 opacity-70"
              step="0.01"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tramitacion" className="text-sm font-medium">
            Tramitación (USD)
          </Label>
          <div className="relative">
            <InputNumber
              id="tramitacion"
              type="number"
              value={processing}
              disabled
              className="w-full pr-8 opacity-70"
              step="0.01"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <DollarSign className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="movilidad" className="text-sm font-medium">
            Movilidad (USD)
          </Label>
          <div className="relative">
            <InputNumber
              id="movilidad"
              type="number"
              value={mobility}
              disabled
              className="w-full pr-8 opacity-70"
              step="0.01"
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
            <InputNumber
              id="margin"
              type="number"
              value={(isMarginPercentage ? marginPercentage : marginPEN) === 0 ? "" : (isMarginPercentage ? marginPercentage : marginPEN)}
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
          <InputNumber
            id="exchangeRate"
            type="number"
            value={exchangeRate === 0 ? "" : exchangeRate}
            onChange={(e) => setExchangeRate(Number(e.target.value))}
            className="w-full"
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Resumen de Precios</h3>
        <Card>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Valor del producto:</div>
              <div className="text-sm text-right">$ {basePrice.toFixed(2)}</div>
              <div className="text-sm font-medium">Envío:</div>
              <div className="text-sm text-right">$ {shipping.toFixed(2)}</div>
              <div className="text-sm font-medium">Tramitación:</div>
              <div className="text-sm text-right">$ {processing.toFixed(2)}</div>
              <div className="text-sm font-medium">Impuesto ({taxPercentage}%):</div>
              <div className="text-sm text-right">$ {(basePrice * (taxPercentage / 100)).toFixed(2)}</div>
              {hasImportTax && (
                <>
                  <div className="text-sm font-medium">Impuestos de importación ({importTaxPercentage}%):</div>
                  <div className="text-sm text-right">$ {importTax.toFixed(2)}</div>
                </>
              )}
              <div className="text-sm font-medium">Movilidad (fijo):</div>
              <div className="text-sm text-right">$ {mobility.toFixed(2)}</div>
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