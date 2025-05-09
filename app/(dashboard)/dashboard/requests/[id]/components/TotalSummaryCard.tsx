"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { InputNumber } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRequestDetailStore } from '@/store/requestDetailStore';
import { Sparkles, ArrowDown, ArrowUp, Calculator } from 'lucide-react';
import { generateAttractivePrices, formatCurrency } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { PricingCalculator } from "@/components/pricing-calculator"; // Added import
import { usePricingCalculations } from '@/hooks/usePricingCalculations';

export const TotalSummaryCard = () => {
  // Consume global state from Zustand store
  const {
    products,
    exchangeRate,
    totalGeneralPEN,
    totalGeneralUSD,
    finalPricePEN,
    finalPriceDisplayCurrency,

    setTotalGeneralPEN,
    setTotalGeneralUSD,
    setFinalPricePEN,
    setFinalPriceDisplayCurrency,
  } = useRequestDetailStore();

  // Use our custom hook for all pricing calculations
  const pricing = usePricingCalculations({
    basePrice: products.reduce((sum, p) => sum + (p.base_price || 0), 0),
    weight: products.reduce((sum, p) => sum + (p.weight || 0), 0),
    initialMarginPEN: 0,
    initialTaxPercentage: 0
  })

  // Extract just what we need for the parent component
  const { totalUSD, totalCosts: shippingCostsUSD } = pricing
  const shippingCostsPEN = shippingCostsUSD * (exchangeRate || 3.7)


  // Local state for UI elements and derived values not in global store
  const [subtotalUSD, setSubtotalUSD] = useState(0);
  const [subtotalPEN, setSubtotalPEN] = useState(0);
  const [, setSubtotalBaseUSD] = useState(0);

  const [profitAmountUSD, setProfitAmountUSD] = useState(0);
  const [profitAmountPEN, setProfitAmountPEN] = useState(0);

  const [enableRounding] = useState(true);
  const [suggestedPrices, setSuggestedPrices] = useState<{ value: number; label: string }[]>([]);
  const [selectedRoundedPrice, setSelectedRoundedPrice] = useState<number | null>(null);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState(0);

  // Effect to calculate and set base totals (USD and PEN) into the store
  useEffect(() => {
    const profitUSD = products.reduce((sum, p) => sum + (p.profit_amount || 0), 0);
    const subtotalUSD = products.reduce((sum, p) => sum + (p.price || 0), 0);
    const subtotalBaseUSD = products.reduce((sum, p) => sum + (p.base_price || 0), 0);
    const calculatedTotalUSD = totalUSD + profitUSD;

    setSubtotalUSD(subtotalUSD);
    setSubtotalBaseUSD(subtotalBaseUSD);
    setProfitAmountUSD(profitUSD);
    setTotalGeneralUSD(calculatedTotalUSD); // Update global store

    // Use exchangeRate from store for PEN calculations
    const currentExchangeRate = exchangeRate || 3.7; // Fallback if store's rate is 0 or undefined initially
    setSubtotalPEN(totalUSD * currentExchangeRate);
    setProfitAmountPEN(profitUSD * currentExchangeRate);
    const calculatedTotalGeneralPEN = calculatedTotalUSD * currentExchangeRate;
    setTotalGeneralPEN(calculatedTotalGeneralPEN); // Update global store

    // The store's exchangeRate is updated when calculations are set, so no need to set it here explicitly
    // unless there's a separate input for manual TC adjustment in this component.

  }, [products, exchangeRate, setTotalGeneralUSD, setTotalGeneralPEN]);

  // Effect to reset finalPricePEN (in store) and local selectedRoundedPrice when totalGeneralPEN (from store) changes
  useEffect(() => {
    setFinalPricePEN(totalGeneralPEN);
    setSelectedRoundedPrice(null);
  }, [totalGeneralPEN, setFinalPricePEN]);

  // Generate Price Suggestions when totals (from store) or display currency (from store) change
  useEffect(() => {
    let basePriceForSuggestions = 0;
    if (finalPriceDisplayCurrency === "PEN") {
      basePriceForSuggestions = totalGeneralPEN;
    } else { // USD
      basePriceForSuggestions = totalGeneralUSD;
    }

    if (basePriceForSuggestions > 0) {
      const suggestions = generateAttractivePrices(basePriceForSuggestions, finalPriceDisplayCurrency);
      setSuggestedPrices(suggestions);
    } else {
      setSuggestedPrices([]);
    }
    setSelectedRoundedPrice(null);
  }, [totalGeneralPEN, totalGeneralUSD, finalPriceDisplayCurrency]);

  // Calculate local adjustmentPercentage whenever finalPricePEN (from store) or totalGeneralPEN (from store) changes
  useEffect(() => {
    if (totalGeneralPEN > 0 && finalPricePEN !== totalGeneralPEN) {
      const adjustment = totalGeneralPEN - finalPricePEN;
      setAdjustmentPercentage((adjustment / totalGeneralPEN) * 100);
    } else {
      setAdjustmentPercentage(0);
    }
  }, [totalGeneralPEN, finalPricePEN]);

  const totalWeight = products.reduce((sum, p) => sum + (p.weight || 0), 0)
  const digitalProductsCount = products.filter(p => p.weight === 0).length

  const handleSuggestionClick = (suggestionValue: number) => {
    setSelectedRoundedPrice(prevSelected => {
      const newSelection = prevSelected === suggestionValue ? null : suggestionValue;
      if (newSelection !== null) {
        if (finalPriceDisplayCurrency === "USD") {
          setFinalPricePEN(newSelection * exchangeRate); // Use exchangeRate from store
        } else {
          setFinalPricePEN(newSelection);
        }
      } else {
        setFinalPricePEN(totalGeneralPEN); // Use totalGeneralPEN from store
      }
      return newSelection;
    });
  };

  const handleFinalPriceInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPriceString = event.target.value;
    setSelectedRoundedPrice(null);

    if (newPriceString === "") {
      setFinalPricePEN(totalGeneralPEN); // Use totalGeneralPEN from store
      return;
    }

    const newRawValue = parseFloat(newPriceString);
    if (!isNaN(newRawValue) && newRawValue >= 0) {
      if (finalPriceDisplayCurrency === "USD") {
        setFinalPricePEN(newRawValue * exchangeRate); // Use exchangeRate from store
      } else {
        setFinalPricePEN(newRawValue);
      }
    }
  };

  // Determine the current final price to display in the input, based on selected currency (from store) and finalPricePEN (from store)
  const displayedFinalPrice = finalPriceDisplayCurrency === "PEN"
    ? finalPricePEN
    : finalPricePEN / (exchangeRate || 3.7); // Fallback for exchangeRate if 0

  // Calculate the actual ganancia to be displayed
  const actualGananciaPEN = profitAmountPEN + (finalPricePEN - totalGeneralPEN);
  // Ensure exchangeRate has a fallback to prevent division by zero if it's not yet set
  const currentExchangeRate = exchangeRate || 3.7;
  const actualGananciaUSD = profitAmountUSD + (finalPricePEN - totalGeneralPEN) / currentExchangeRate;

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">Resumen de Totales</CardTitle>
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Calculator className="h-5 w-5" />
                <span className="sr-only">Abrir Calculadora de Precios</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Calculadora de Precios</DrawerTitle>
                <DrawerDescription>
                  Ajusta los precios y revisa los márgenes de ganancia.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4">
                <PricingCalculator
                  disabled={true} // You might want to make these props dynamic
                  basePrice={subtotalUSD}
                  weight={totalWeight}
                  taxPercentage={0}
                />
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Cerrar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>Peso Total: {totalWeight.toFixed(2)} kg {digitalProductsCount > 0 && `(${digitalProductsCount} digital)`}</div>
          <div className="text-right">TC: S/. {(exchangeRate || 0).toFixed(2)}</div> {/* Use exchangeRate from store */}
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm">Subtotal:</span>
            <span className="text-sm font-semibold">
              ${subtotalUSD.toFixed(2)} / S/. {subtotalPEN.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Gastos de envio:</span>
            <span className="text-sm font-semibold">
              ${shippingCostsUSD.toFixed(2)} / S/. {shippingCostsPEN.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Ganancia Total:</span>
            <span className="text-sm font-semibold text-green-600">
              ${actualGananciaUSD.toFixed(2)} / S/. {actualGananciaPEN.toFixed(2)}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span className="text-base font-bold">Total:</span>
            <span className="text-base font-bold">
              ${totalGeneralUSD.toFixed(2)} / S/. {totalGeneralPEN.toFixed(2)} {/* Use totals from store */}
            </span>
          </div>
        </div>

        <Separator />

        {/* --- Currency Toggle for Final Price and Suggestions --- */}
        <div className="bg-muted/50 p-3 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="finalPriceDisplayCurrencyToggle" className="text-sm font-medium">
              Moneda para Precio Final y Sugerencias:
            </Label>
            <ToggleGroup
              id="finalPriceDisplayCurrencyToggle"
              type="single"
              variant="outline"
              value={finalPriceDisplayCurrency} // Use from store
              onValueChange={(value) => {
                if (value) {
                  setFinalPriceDisplayCurrency(value as "PEN" | "USD"); // Update store
                  setFinalPricePEN(totalGeneralPEN); // Update store, using totalGeneralPEN from store
                  setSelectedRoundedPrice(null);
                }
              }}
              className="h-9"
            >
              <ToggleGroupItem value="PEN" aria-label="PEN" size="sm">S/.</ToggleGroupItem>
              <ToggleGroupItem value="USD" aria-label="USD" size="sm">$</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="enableRounding" className="text-sm font-medium">
                  Ajustar Precio Final
                </Label>
              </div>
              {enableRounding && <Sparkles className="h-5 w-5 text-amber-500" />}
            </div>

            {enableRounding && suggestedPrices.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground">Selecciona un precio sugerido:</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {suggestedPrices.map((suggestion) => (
                    <Button
                      key={suggestion.label}
                      variant={selectedRoundedPrice === suggestion.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion.value)}
                      className="text-xs h-auto py-1.5 px-2 whitespace-normal text-center w-full"
                    >
                      {suggestion.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {enableRounding && (selectedRoundedPrice !== null || finalPricePEN !== totalGeneralPEN) && (
              <div className={`grid grid-cols-2 gap-x-2 gap-y-1 p-3 rounded-md mt-2 text-sm ${adjustmentPercentage >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <div className="font-medium">Precio Ajustado:</div>
                <div className="text-right font-bold">
                  S/. {finalPricePEN.toFixed(2)} {/* Use finalPricePEN from store */}
                  {finalPriceDisplayCurrency === "USD" && ` ( ${formatCurrency(finalPricePEN / (exchangeRate || 3.7), "USD")} )`}
                </div>

                <div className="font-medium">
                  {adjustmentPercentage >= 0 ? "Descuento:" : "Incremento:"}
                </div>
                <div className={`text-right font-semibold ${adjustmentPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(adjustmentPercentage).toFixed(2)}% (S/. {Math.abs(totalGeneralPEN - finalPricePEN).toFixed(2)})
                </div>

                <div className="col-span-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Original: S/. {totalGeneralPEN.toFixed(2)}</span> {/* Use totalGeneralPEN from store */}
                    {adjustmentPercentage >= 0 && finalPricePEN < totalGeneralPEN ?
                      <ArrowDown className="h-3 w-3 text-green-600" /> :
                      (adjustmentPercentage < 0 && finalPricePEN > totalGeneralPEN ?
                        <ArrowUp className="h-3 w-3 text-red-600" /> : null)
                    }
                    <span>Ajustado: S/. {finalPricePEN.toFixed(2)}</span> {/* Use finalPricePEN from store */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* --- Final Price Input Section --- */}
        <div className="bg-primary/10 p-3 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="finalPriceInput" className="text-lg font-bold">
              PRECIO FINAL ({finalPriceDisplayCurrency === "PEN" ? "S/." : "$"}): {/* Use from store */}
            </Label>
          </div>
          <InputNumber
            id="finalPriceInput"
            value={parseFloat(displayedFinalPrice.toFixed(2))}
            onChange={handleFinalPriceInputChange}
            className="text-lg font-bold text-right w-full p-1 border-primary/50 focus:border-primary"
            step={0.01}
            min={0}
            key={finalPriceDisplayCurrency} // Use from store
          />
          {(selectedRoundedPrice !== null || finalPricePEN !== totalGeneralPEN) && adjustmentPercentage !== 0 && (
            <div className="text-xs text-muted-foreground col-span-2 text-right pt-1">
              {`Ajuste del ${Math.abs(adjustmentPercentage).toFixed(2)}% aplicado sobre S/. ${totalGeneralPEN.toFixed(2)}`} {/* Use totalGeneralPEN from store */}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
