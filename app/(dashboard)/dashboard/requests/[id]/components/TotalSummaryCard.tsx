"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRequestDetailStore } from '@/store/requestDetailStore';
import { Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export const TotalSummaryCard = () => {
  const [finalPriceInput, setFinalPriceInput] = useState('');
  const [isEditingFinalPrice, setIsEditingFinalPrice] = useState(false);
  const [showShippingDetails, setShowShippingDetails] = useState(false);
  const [profitInput, setProfitInput] = useState('');
  const [isEditingProfit, setIsEditingProfit] = useState(false);
  const [showProfitDetails, setShowProfitDetails] = useState(false);
  const [additionalProfitInput, setAdditionalProfitInput] = useState('');
  const [isEditingAdditionalProfit, setIsEditingAdditionalProfit] = useState(false);
  
  const debouncedFinalPrice = useDebounce(finalPriceInput, 500);
  const trpc = useTRPC();
  
  // Obtener tipo de cambio actual de la base de datos
  const { data: currentExchangeRate } = useQuery({
    ...trpc.exchangeRate.getCurrent.queryOptions(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Mutación para actualizar el request
  const updateRequestMutation = useMutation(
    trpc.requests.updateRequest.mutationOptions()
  );

  const {
    request,
    shipping: shippingCostsUSD,
    setFinalPrice,
    setExchangeRate: setStoreExchangeRate
  } = useRequestDetailStore();

  // ============================================================================
  // ESTRUCTURA DE PRECIOS
  // ============================================================================
  // 1. Subtotal (USD) = Suma de precios base de productos
  // 2. Envío (USD) = Costos de envío calculados
  // 3. Precio Calculado (USD) = Subtotal + Envío + Ganancia Base
  // 4. Precio Final (USD) = Precio ajustado por usuario (nunca menor a costos)
  // 5. Ganancia Total (USD) = Precio Final - (Subtotal + Envío)
  // ============================================================================

  // Usar tipo de cambio de COMPRA (buy_price) para convertir USD a PEN
  const buyExchangeRate = currentExchangeRate && 'buy_price' in currentExchangeRate
    ? currentExchangeRate.buy_price ?? 0
    : 0;
  const officialExchangeRate = buyExchangeRate > 0 ? buyExchangeRate : (request?.exchange_rate ?? 3.65);
  
  // Tipo de cambio ajustado (+0.02)
  const exchangeRateAdjustment = 0.02;
  const exchangeRate = officialExchangeRate + exchangeRateAdjustment;
  
  const subTotal = request?.sub_total ?? 0;
  const weight = request?.weight ?? 0;
  
  // Ganancia de productos (en PEN, convertir a USD)
  const productsProfitPEN = request?.products?.reduce((sum, p) => sum + (p.profit_amount || 0), 0) ?? 0;
  const productsProfitUSD = productsProfitPEN / officialExchangeRate;
  
  // Ganancia adicional (guardada en request.profit en USD)
  const additionalProfitUSD = request?.profit ?? 0;
  
  // Ganancia total = ganancia de productos + ganancia adicional
  const totalProfitUSD = productsProfitUSD + additionalProfitUSD;
  
  // Desglose de costos de envío
  const SHIPPING_PER_KG = 7; // $7 por kilo
  const PROCESSING_FEE = 7;  // $7 tramitación
  const HANDLING_FEE = 5;    // $5 movilidad
  
  const shippingByWeight = weight * SHIPPING_PER_KG;
  const totalShippingCost = shippingByWeight + PROCESSING_FEE + HANDLING_FEE;
  
  // Costos totales (mínimo a cubrir)
  const totalCostsUSD = subTotal + totalShippingCost;
  
  // Precio calculado (costo + ganancia de productos)
  const calculatedPriceUSD = totalCostsUSD + productsProfitUSD;
  
  // Precio final (ajustado, nunca menor a costos)
  const requestedFinalPrice = request?.final_price ?? calculatedPriceUSD;
  const finalPriceUSD = Math.max(requestedFinalPrice, totalCostsUSD);
  
  const profitMarginPercent = totalCostsUSD > 0 ? (totalProfitUSD / totalCostsUSD) * 100 : 0;
  
  // Conversiones a PEN
  const totalCostsPEN = totalCostsUSD * exchangeRate;
  const calculatedPricePEN = calculatedPriceUSD * exchangeRate;
  const finalPricePEN = finalPriceUSD * exchangeRate;
  const totalProfitPEN = totalProfitUSD * exchangeRate;
  const subTotalPEN = subTotal * exchangeRate;
  const shippingCostsPEN = totalShippingCost * exchangeRate;
  const shippingByWeightPEN = shippingByWeight * exchangeRate;
  const processingFeePEN = PROCESSING_FEE * exchangeRate;
  const handlingFeePEN = HANDLING_FEE * exchangeRate;
  const productsProfitPENDisplay = productsProfitUSD * exchangeRate;
  const additionalProfitPEN = additionalProfitUSD * exchangeRate;

  // Ajuste de precio
  const priceAdjustment = finalPriceUSD - calculatedPriceUSD;
  const hasAdjustment = Math.abs(priceAdjustment) > 0.01;

  // Inicializar inputs
  useEffect(() => {
    setFinalPriceInput(finalPriceUSD.toFixed(2));
  }, [finalPriceUSD]);

  useEffect(() => {
    setProfitInput(totalProfitUSD.toFixed(2));
  }, [totalProfitUSD]);

  useEffect(() => {
    setAdditionalProfitInput(additionalProfitUSD.toFixed(2));
  }, [additionalProfitUSD]);

  useEffect(() => {
    if (debouncedFinalPrice !== '') {
      // TODO: Actualizar precio final en backend
      console.log('Actualizar precio final:', debouncedFinalPrice);
    }
  }, [debouncedFinalPrice]);

  // Handlers
  const handleFinalPriceEdit = () => {
    setIsEditingFinalPrice(true);
  };

  const handleFinalPriceSave = () => {
    const numericValue = parseFloat(finalPriceInput);
    if (!isNaN(numericValue) && numericValue > 0) {
      const safeValue = Math.max(numericValue, totalCostsUSD);
      setFinalPrice(safeValue);
      setIsEditingFinalPrice(false);
      toast.success('Precio final actualizado');
    } else {
      toast.error('Precio inválido');
      setFinalPriceInput(finalPriceUSD.toFixed(2));
    }
  };

  const handleFinalPriceCancel = () => {
    setFinalPriceInput(finalPriceUSD.toFixed(2));
    setIsEditingFinalPrice(false);
  };

  const handleProfitEdit = () => {
    // Si hay ganancia de productos, abrir desglose en lugar de editar
    if (productsProfitUSD > 0) {
      setShowProfitDetails(true);
    } else {
      setIsEditingProfit(true);
    }
  };

  const handleProfitSave = () => {
    const numericValue = parseFloat(profitInput);
    if (!isNaN(numericValue) && numericValue >= 0) {
      // Calcular nuevo precio final basado en la ganancia deseada
      const newFinalPrice = totalCostsUSD + numericValue;
      setFinalPrice(newFinalPrice);
      setIsEditingProfit(false);
      toast.success('Ganancia actualizada');
    } else {
      toast.error('Ganancia inválida');
      setProfitInput(totalProfitUSD.toFixed(2));
    }
  };

  const handleProfitCancel = () => {
    setProfitInput(totalProfitUSD.toFixed(2));
    setIsEditingProfit(false);
  };

  const handleAdditionalProfitEdit = () => {
    setIsEditingAdditionalProfit(true);
  };

  const handleAdditionalProfitSave = async () => {
    const numericValue = parseFloat(additionalProfitInput);
    if (!isNaN(numericValue)) {
      // Calcular nuevo precio final: costos + ganancia de productos + ajuste
      const newFinalPrice = totalCostsUSD + productsProfitUSD + numericValue;
      
      // Optimistic update
      setFinalPrice(newFinalPrice);
      setIsEditingAdditionalProfit(false);
      
      // Backend update
      try {
        await updateRequestMutation.mutateAsync({
          id: request?.id ?? '',
          finalPrice: newFinalPrice,
          profit: numericValue
        });
      } catch (error) {
        toast.error('Error al actualizar la ganancia');
        // Revertir cambios
        setAdditionalProfitInput(additionalProfitUSD.toFixed(2));
      }
    } else {
      toast.error('Valor inválido');
      setAdditionalProfitInput(additionalProfitUSD.toFixed(2));
    }
  };

  const handleAdditionalProfitCancel = () => {
    setAdditionalProfitInput(additionalProfitUSD.toFixed(2));
    setIsEditingAdditionalProfit(false);
  };


  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Resumen</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Desglose ordenado */}
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <div className="text-right">
              <div className="font-semibold">${subTotal.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">S/. {subTotalPEN.toFixed(2)}</div>
            </div>
          </div>

          {/* Envío con Dropdown */}
          <div>
            <button
              onClick={() => setShowShippingDetails(!showShippingDetails)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Envío</span>
                <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${showShippingDetails ? 'rotate-180' : ''}`} />
              </div>
              <div className="text-right">
                <div className="font-semibold">${totalShippingCost.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">S/. {shippingCostsPEN.toFixed(2)}</div>
              </div>
            </button>

            {/* Detalles de Envío */}
            {showShippingDetails && (
              <div className="mt-2 ml-4 pl-3 border-l-2 border-border space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="text-xs text-muted-foreground mb-2">Peso total: {weight.toFixed(2)} kg</div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{weight.toFixed(2)} kg × $7</span>
                  <div className="text-right">
                    <div className="font-medium">${shippingByWeight.toFixed(2)}</div>
                    <div className="text-muted-foreground">S/. {shippingByWeightPEN.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tramitación</span>
                  <div className="text-right">
                    <div className="font-medium">${PROCESSING_FEE.toFixed(2)}</div>
                    <div className="text-muted-foreground">S/. {processingFeePEN.toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Movilidad</span>
                  <div className="text-right">
                    <div className="font-medium">${HANDLING_FEE.toFixed(2)}</div>
                    <div className="text-muted-foreground">S/. {handlingFeePEN.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ganancia con edición y desglose */}
          <div>
            {isEditingProfit ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Ganancia</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={profitInput}
                      onChange={(e) => setProfitInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleProfitSave()}
                      className="w-full pl-7 pr-3 py-2 text-sm font-semibold text-right border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <Button size="icon" className="h-9 w-9" onClick={handleProfitSave}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleProfitCancel}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-full flex items-center justify-between">
                  <button
                    onClick={() => setShowProfitDetails(!showProfitDetails)}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm text-muted-foreground">Ganancia</span>
                    {productsProfitUSD > 0 && (
                      <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${showProfitDetails ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  <button
                    onClick={handleProfitEdit}
                    className="group text-right px-2 py-1 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-semibold text-green-600 border-b border-dashed border-transparent group-hover:border-green-600/30 transition-colors">
                      ${totalProfitUSD.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">S/. {totalProfitPEN.toFixed(2)}</div>
                  </button>
                </div>

                {/* Detalles de Ganancia */}
                {showProfitDetails && productsProfitUSD > 0 && (
                  <div className="mt-2 ml-4 pl-3 border-l-2 border-border space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Ganancia de productos</span>
                      <div className="text-right">
                        <div className="font-medium">${productsProfitUSD.toFixed(2)}</div>
                        <div className="text-muted-foreground">S/. {productsProfitPENDisplay.toFixed(2)}</div>
                      </div>
                    </div>
                    
                    {/* Ajuste de ganancia - siempre mostrar si hay baseProfit */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Ajuste de ganancia</span>
                      {isEditingAdditionalProfit ? (
                        <div className="flex items-center gap-1">
                          <div className="relative">
                            <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={additionalProfitInput}
                              onChange={(e) => setAdditionalProfitInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAdditionalProfitSave()}
                              className="w-16 pl-4 pr-1 py-0.5 text-xs text-right border rounded"
                              autoFocus
                            />
                          </div>
                          <Button size="icon" className="h-5 w-5" onClick={handleAdditionalProfitSave}>
                            <Check className="h-2.5 w-2.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleAdditionalProfitCancel}>
                            <X className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAdditionalProfitEdit}
                          className="text-right px-1 py-0.5 rounded hover:bg-muted/50 transition-colors"
                        >
                          <div className={`font-medium border-b border-dashed border-transparent hover:border-current transition-colors ${additionalProfitUSD > 0 ? 'text-green-600' : additionalProfitUSD < 0 ? 'text-red-600' : ''}`}>
                            ${additionalProfitUSD > 0 ? '+' : ''}{additionalProfitUSD.toFixed(2)}
                          </div>
                          <div className="text-muted-foreground">
                            S/. {additionalProfitUSD > 0 ? '+' : ''}{additionalProfitPEN.toFixed(2)}
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <Separator />

        {/* Precio Final */}
        <div>
          {isEditingFinalPrice ? (
            <div className="space-y-2">
              <span className="text-sm font-medium">Precio Final</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min={totalCostsUSD.toFixed(2)}
                    value={finalPriceInput}
                    onChange={(e) => setFinalPriceInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFinalPriceSave()}
                    className="w-full pl-7 pr-3 py-2 text-sm font-semibold text-right border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
                <Button size="icon" className="h-9 w-9" onClick={handleFinalPriceSave}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleFinalPriceCancel}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Precio Final</span>
              <button
                onClick={handleFinalPriceEdit}
                className="group text-right px-3 py-2 rounded hover:bg-muted/50 transition-colors"
              >
                <div className="text-2xl font-bold border-b-2 border-dashed border-transparent group-hover:border-primary/30 transition-colors inline-block">
                  ${finalPriceUSD.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">S/. {finalPricePEN.toFixed(2)}</div>
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
