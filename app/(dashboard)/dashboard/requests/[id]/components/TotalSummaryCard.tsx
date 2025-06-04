"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
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
import { PricingCalculator } from "@/components/pricing-calculator";
import { usePricingCalculations } from '@/hooks/usePricingCalculations';
import { useDebounce } from '@/hooks/use-debounce';

export const TotalSummaryCard = () => {
  const [enableRounding] = useState(true);
  const [suggestedPrices, setSuggestedPrices] = useState<{ value: number; label: string }[]>([]);
  const [selectedRoundedPrice, setSelectedRoundedPrice] = useState<number | null>(null);
  const [finalPriceValue, setFinalPriceValue] = useState('');
  const debounceFinalPrice = useDebounce(finalPriceValue, 500);

  const {
    request,
    shipping: shippingCostsUSD,
    finalPriceDisplayCurrency: displayCurrencyForFinalPrice,

    setCurrency,
    setFinalPrice
  } = useRequestDetailStore();

  const currency = request?.currency ?? "PEN"; 
  const exchangeRate = request?.exchange_rate ?? 0;
  const price = request?.price ?? 0;
  const finalPrice = request?.final_price ?? 0;
  
  const subTotal = request?.sub_total ?? 0;
  const profit = request?.profit ?? 0;
  const weight = request?.weight ?? 0;


  console.log('profit', profit);
  console.log('finalPrice', finalPrice);
  console.log('price', price);
  


  const subTotalPEN = subTotal * exchangeRate;
  const shippingCostsPEN = shippingCostsUSD * exchangeRate;
  const pricePEN = price * exchangeRate;
  const finalPricePEN = finalPrice * exchangeRate;
  const actualProfitUSD = profit + (finalPrice - price);
  const actualProfitPEN = actualProfitUSD * exchangeRate;
  console.log('actualProfitPEN', actualProfitPEN);
  console.log('exchangeRate', exchangeRate);

  let calculatedAdjustmentPercentage = 0;
  if (price > 0) {
    const difference = price - finalPrice;
    if (Math.abs(difference) > 0.001) {
      calculatedAdjustmentPercentage = (difference / price) * 100;
    }
  }

  useEffect(() => {
    const basePriceForSuggestions = currency === "PEN" ? pricePEN : price;

    if (basePriceForSuggestions > 0) {
      const suggestions = generateAttractivePrices(basePriceForSuggestions, currency as "PEN" | "USD");
      setSuggestedPrices(suggestions);
    } else {
      setSuggestedPrices([]);
    }
    setSelectedRoundedPrice(null);

    const currentFinalPrice = currency === "USD" ? finalPrice : finalPrice * exchangeRate;
    setFinalPriceValue(currentFinalPrice.toFixed(2));

  }, [request?.price, request?.currency]);

  useEffect(() => {
    if (debounceFinalPrice !== '') {
      // CALL TRPC TO UPDATE FINAL PRICE
      console.log('CALL TRPC TO UPDATE FINAL PRICE', debounceFinalPrice);
    }
  }, [debounceFinalPrice]);

  const handleSuggestionClick = (suggestionValue: number) => {
    setSelectedRoundedPrice(prevSelected => {
      const newSelection = prevSelected === suggestionValue ? null : suggestionValue;
      const baseTotalForDisplay = currency === "PEN" ? pricePEN : price;

      if (newSelection !== null) {
        setFinalPriceValue(newSelection.toFixed(2));
        setFinalPrice(newSelection);
      } else {
        setFinalPriceValue(baseTotalForDisplay.toFixed(2));
        setFinalPrice(baseTotalForDisplay);
      }
      return newSelection;
    });
  };

  const handleFinalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFinalPriceValue(value);
    setFinalPrice(Number(value));
    setSelectedRoundedPrice(null);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold">Totals Summary</CardTitle>
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Calculator className="h-5 w-5" />
                <span className="sr-only">Open Pricing Calculator</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Pricing Calculator</DrawerTitle>
                <DrawerDescription>
                  Adjust prices and review profit margins.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4">
                <PricingCalculator
                  disabled={true} 
                  basePrice={subTotal}
                  weight={weight}
                  taxPercentage={0}
                />
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>Total Weight: {weight.toFixed(2)} kg</div>
          <div className="text-right">ER: S/. {(exchangeRate || 0).toFixed(2)}</div> 
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-sm">Subtotal:</span>
            <span className="text-sm font-semibold">
              ${subTotal.toFixed(2)} / S/. {subTotalPEN.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Shipping Costs:</span>
            <span className="text-sm font-semibold">
              ${shippingCostsUSD.toFixed(2)} / S/. {shippingCostsPEN.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Total Profit:</span>
            <span className="text-sm font-semibold text-green-600">
              ${actualProfitUSD.toFixed(2)} / S/. {actualProfitPEN.toFixed(2)}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span className="text-base font-bold">Total:</span>
            <span className="text-base font-bold">
              ${price.toFixed(2)} / S/. {pricePEN.toFixed(2)} 
            </span>
          </div>
        </div>

        <Separator />

        <div className="bg-muted/50 p-3 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="finalPriceDisplayCurrencyToggle" className="text-sm font-medium">
              Currency for Final Price & Suggestions:
            </Label>
            <ToggleGroup
              id="finalPriceDisplayCurrencyToggle"
              type="single"
              variant="outline"
              value={currency} 
              onValueChange={(value) => {
                if (value) {
                  setCurrency(value as "PEN" | "USD"); 
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
                  Adjust Final Price
                </Label>
              </div>
              {enableRounding && <Sparkles className="h-5 w-5 text-amber-500" />}
            </div>

            {enableRounding && suggestedPrices.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground">Select a Suggested Price:</Label>
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

            {enableRounding && (selectedRoundedPrice !== null || finalPrice !== price) && (
              <div className={`grid grid-cols-2 gap-x-2 gap-y-1 p-3 rounded-md mt-2 text-sm ${calculatedAdjustmentPercentage >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <div className="font-medium">Adjusted Price:</div>
                <div className="text-right font-bold">
                  S/. {pricePEN.toFixed(2)} 
                  {displayCurrencyForFinalPrice === "USD" && ` ( ${formatCurrency(pricePEN / (exchangeRate || 3.7), "USD")} )`}
                </div>

                <div className="font-medium">
                  {calculatedAdjustmentPercentage >= 0 ? "Discount Applied:" : "Price Increase Applied:"}
                </div>
                <div className={`text-right font-semibold ${calculatedAdjustmentPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(calculatedAdjustmentPercentage).toFixed(2)}% (S/. {Math.abs(price - finalPrice).toFixed(2)})
                </div>

                <div className="col-span-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Original: S/. {pricePEN.toFixed(2)}</span> 
                    {calculatedAdjustmentPercentage >= 0 && finalPrice < price ?
                      <ArrowDown className="h-3 w-3 text-green-600" /> :
                      (calculatedAdjustmentPercentage < 0 && finalPrice > price ?
                        <ArrowUp className="h-3 w-3 text-red-600" /> : null)
                    }
                    <span>Adjusted: S/. {finalPricePEN.toFixed(2)}</span> 
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="p-3 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="finalPriceInput" className="text-lg font-bold">
              FINAL PRICE ({displayCurrencyForFinalPrice === "PEN" ? "S/." : "$"}): 
            </Label>
          </div>
          <input
            id="finalPriceInput"
            type="text"
            value={finalPriceValue}
            onChange={handleFinalPriceChange}
            className="text-lg font-bold text-right w-full p-1 border rounded border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {(selectedRoundedPrice !== null || finalPrice !== price) && calculatedAdjustmentPercentage !== 0 && (
            <div className="text-xs text-muted-foreground col-span-2 text-right pt-1">
              {`Adjustment of ${Math.abs(calculatedAdjustmentPercentage).toFixed(2)}% applied to S/. ${pricePEN.toFixed(2)}`} 
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
