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
    finalPriceDisplayCurrency: displayCurrencyForFinalPrice,

    setFinalPriceUSD: setCurrentFinalPriceUSDInStore,
    setTotalGeneralUSD: setTotalGeneralUSDInStore,
    setFinalPriceDisplayCurrency: setDisplayCurrencyForFinalPriceInStore,
    setProfit
  } = useRequestDetailStore();

  // Use our custom hook for all pricing calculations
  const pricing = usePricingCalculations({
    basePrice: products.reduce((sum, p) => sum + (p.base_price || 0), 0),
    weight: products.reduce((sum, p) => sum + (p.weight || 0), 0),
    initialMarginPEN: 0,
    initialTaxPercentage: 0
  })

  // Extract just what we need for the parent component
  const { totalCosts: shippingCostsUSD } = pricing

  const [totalGeneralPEN, setLocalTotalGeneralPEN] = useState(0);
  const [totalGeneralUSD, setLocalTotalGeneralUSD] = useState(0);
  const [currentFinalPricePEN, setLocalCurrentFinalPricePEN] = useState(0);
  const [currentFinalPriceUSD, setLocalCurrentFinalPriceUSD] = useState(0);

  const [enableRounding] = useState(true);
  const [suggestedPrices, setSuggestedPrices] = useState<{ value: number; label: string }[]>([]);
  const [selectedRoundedPrice, setSelectedRoundedPrice] = useState<number | null>(null);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState(0);

  // Generate Price Suggestions when totals (from store) or display currency (from store) change
  useEffect(() => {
    let basePriceForSuggestions = 0;
    if (displayCurrencyForFinalPrice === "PEN") {
      basePriceForSuggestions = totalGeneralPEN;
    } else { // USD
      basePriceForSuggestions = totalGeneralUSD;
    }

    if (basePriceForSuggestions > 0) {
      const suggestions = generateAttractivePrices(basePriceForSuggestions, displayCurrencyForFinalPrice);
      setSuggestedPrices(suggestions);
    } else {
      setSuggestedPrices([]);
    }
    setSelectedRoundedPrice(null);
  }, [totalGeneralPEN, totalGeneralUSD, displayCurrencyForFinalPrice]);

  // Calculate local adjustmentPercentage whenever currentFinalPricePEN or totalGeneralPEN changes
  useEffect(() => {
    if (totalGeneralPEN > 0 && currentFinalPricePEN !== totalGeneralPEN) {
      const adjustment = totalGeneralPEN - currentFinalPricePEN;
      setAdjustmentPercentage((adjustment / totalGeneralPEN) * 100);
    } else {
      setAdjustmentPercentage(0);
    }
  }, [totalGeneralPEN, currentFinalPricePEN]);

  useEffect(() => {
    const subtotalUSD = products.reduce((sum, p) => sum + (p.price || 0), 0); // Multiply by quantity
    const subtotalPEN = subtotalUSD * exchangeRate;
    const shippingCostsPEN = shippingCostsUSD * exchangeRate;
    const profitPEN = products.reduce((sum, p) => sum + (p.profit_amount || 0), 0); // Assuming profit_amount is total, not per unit
    const totalPEN = subtotalPEN + shippingCostsPEN + profitPEN;
    const totalUSD = totalPEN / exchangeRate;
    
    setLocalTotalGeneralPEN(totalPEN);
    setLocalTotalGeneralUSD(totalUSD);
    setTotalGeneralUSDInStore(totalUSD); // Update store with USD value
    
    setLocalCurrentFinalPricePEN(totalPEN);
    setLocalCurrentFinalPriceUSD(totalUSD);
    setCurrentFinalPriceUSDInStore(totalUSD); // Update store with USD value
  }, [products, exchangeRate, shippingCostsUSD, setCurrentFinalPriceUSDInStore, setTotalGeneralUSDInStore]);

  const totalWeight = products.reduce((sum, p) => sum + (p.weight || 0), 0);
  const subtotalUSD = products.reduce((sum, p) => sum + (p.price || 0), 0);
  const subtotalPEN = subtotalUSD * exchangeRate;
  const shippingCostsPEN = shippingCostsUSD * exchangeRate;
  const profitPEN = products.reduce((sum, p) => sum + (p.profit_amount || 0), 0);
  
  const actualProfitPEN = profitPEN + (currentFinalPricePEN - totalGeneralPEN);
  const actualProfitUSD = actualProfitPEN / exchangeRate;

  // Save the actual profit to the store when it changes
  useEffect(() => {
    setProfit(actualProfitPEN); // Keep profit in PEN as requested
  }, [actualProfitPEN, setProfit]);

  // Determine the current final price to display in the input, based on selected currency
  const displayedFinalPrice = displayCurrencyForFinalPrice === "PEN"
    ? currentFinalPricePEN
    : currentFinalPriceUSD;

  const handleSuggestionClick = (suggestionValue: number) => {
    setSelectedRoundedPrice(prevSelected => {
      const newSelection = prevSelected === suggestionValue ? null : suggestionValue;

      if (newSelection !== null) {
        // A new suggestion is selected
        if (displayCurrencyForFinalPrice === "PEN") {
          setLocalCurrentFinalPricePEN(newSelection);
          const usdValue = newSelection / exchangeRate;
          setLocalCurrentFinalPriceUSD(usdValue);
          setCurrentFinalPriceUSDInStore(usdValue); // Store in USD
        } else { // USD
          setLocalCurrentFinalPriceUSD(newSelection);
          setLocalCurrentFinalPricePEN(newSelection * exchangeRate);
          setCurrentFinalPriceUSDInStore(newSelection); // Store in USD
        }
      } else {
        // Suggestion is deselected, revert to original values
        setLocalCurrentFinalPricePEN(totalGeneralPEN);
        setLocalCurrentFinalPriceUSD(totalGeneralUSD);
        setCurrentFinalPriceUSDInStore(totalGeneralUSD); // Store in USD
      }
      return newSelection; // Updates selectedRoundedPrice state
    });
  };

  const handleFinalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPriceString = e.target.value;
    setSelectedRoundedPrice(null);

    if (newPriceString === "") {
      setLocalCurrentFinalPricePEN(totalGeneralPEN);
      setLocalCurrentFinalPriceUSD(totalGeneralUSD);
      setCurrentFinalPriceUSDInStore(totalGeneralUSD); // Store in USD
      return;
    }

    const newPrice = parseFloat(newPriceString);
    if (!isNaN(newPrice)) {
      if (displayCurrencyForFinalPrice === "PEN") {
        setLocalCurrentFinalPricePEN(newPrice);
        const usdValue = newPrice / exchangeRate;
        setLocalCurrentFinalPriceUSD(usdValue);
        setCurrentFinalPriceUSDInStore(usdValue); // Store in USD
      } else { // USD
        setLocalCurrentFinalPriceUSD(newPrice);
        setLocalCurrentFinalPricePEN(newPrice * exchangeRate);
        setCurrentFinalPriceUSDInStore(newPrice); // Store in USD
      }
    }
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
                  basePrice={subtotalUSD}
                  weight={totalWeight}
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
          <div>Total Weight: {totalWeight.toFixed(2)} kg</div>
          <div className="text-right">ER: S/. {(exchangeRate || 0).toFixed(2)}</div> 
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
              ${totalGeneralUSD.toFixed(2)} / S/. {totalGeneralPEN.toFixed(2)} 
            </span>
          </div>
        </div>

        <Separator />

        {/* --- Currency Toggle for Final Price and Suggestions --- */}
        <div className="bg-muted/50 p-3 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <Label htmlFor="finalPriceDisplayCurrencyToggle" className="text-sm font-medium">
              Currency for Final Price & Suggestions:
            </Label>
            <ToggleGroup
              id="finalPriceDisplayCurrencyToggle"
              type="single"
              variant="outline"
              value={displayCurrencyForFinalPrice} 
              onValueChange={(value) => {
                if (value) {
                  setDisplayCurrencyForFinalPriceInStore(value as "PEN" | "USD"); 
                  setLocalCurrentFinalPricePEN(totalGeneralPEN); 
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

            {enableRounding && (selectedRoundedPrice !== null || currentFinalPricePEN !== totalGeneralPEN) && (
              <div className={`grid grid-cols-2 gap-x-2 gap-y-1 p-3 rounded-md mt-2 text-sm ${adjustmentPercentage >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <div className="font-medium">Adjusted Price:</div>
                <div className="text-right font-bold">
                  S/. {currentFinalPricePEN.toFixed(2)} 
                  {displayCurrencyForFinalPrice === "USD" && ` ( ${formatCurrency(currentFinalPricePEN / (exchangeRate || 3.7), "USD")} )`}
                </div>

                <div className="font-medium">
                  {adjustmentPercentage >= 0 ? "Discount Applied:" : "Price Increase Applied:"}
                </div>
                <div className={`text-right font-semibold ${adjustmentPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(adjustmentPercentage).toFixed(2)}% (S/. {Math.abs(totalGeneralPEN - currentFinalPricePEN).toFixed(2)})
                </div>

                <div className="col-span-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Original: S/. {totalGeneralPEN.toFixed(2)}</span> 
                    {adjustmentPercentage >= 0 && currentFinalPricePEN < totalGeneralPEN ?
                      <ArrowDown className="h-3 w-3 text-green-600" /> :
                      (adjustmentPercentage < 0 && currentFinalPricePEN > totalGeneralPEN ?
                        <ArrowUp className="h-3 w-3 text-red-600" /> : null)
                    }
                    <span>Adjusted: S/. {currentFinalPricePEN.toFixed(2)}</span> 
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
              FINAL PRICE ({displayCurrencyForFinalPrice === "PEN" ? "S/." : "$"}): 
            </Label>
          </div>
          <InputNumber
            id="finalPriceInput"
            value={displayedFinalPrice} // Simplified value prop
            onChange={handleFinalPriceChange}
            className="text-lg font-bold text-right w-full p-1 border-primary/50 focus:border-primary"
            step={0.01}
            min={0}
            key={displayCurrencyForFinalPrice} 
          />
          {(selectedRoundedPrice !== null || currentFinalPricePEN !== totalGeneralPEN) && adjustmentPercentage !== 0 && (
            <div className="text-xs text-muted-foreground col-span-2 text-right pt-1">
              {`Adjustment of ${Math.abs(adjustmentPercentage).toFixed(2)}% applied to S/. ${totalGeneralPEN.toFixed(2)}`} 
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
