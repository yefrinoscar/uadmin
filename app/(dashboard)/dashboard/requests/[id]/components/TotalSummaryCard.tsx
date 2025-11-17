"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useRequestDetailStore } from '@/store/requestDetailStore';
import { PricingConstants } from '@/config/pricing-constants';
import { InlineEditableValue } from '@/components/inline-editable-value';
import { DisplayValue } from '@/components/display-value';
import { DropdownValue } from '@/components/dropdown-value';
import { useTRPC } from '@/trpc/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export const TotalSummaryCard = () => {
  const trpc = useTRPC();

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

  // Tipo de cambio guardado en la solicitud
  const storedExchangeRate = request?.exchange_rate ?? 0;
  const exchangeRate = storedExchangeRate > 0 ? storedExchangeRate : PricingConstants.DEFAULT_EXCHANGE_RATE;
  
  const handleExchangeRateSave = async (nextValue: string) => {
    if (!request?.id) {
      toast.error('Solicitud no disponible');
      throw new Error('Missing request id');
    }

    const numericValue = parseFloat(nextValue);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      toast.error('Tipo de cambio inválido');
      throw new Error('Invalid exchange rate');
    }

    const previousExchangeRate = exchangeRate;
    setStoreExchangeRate(numericValue);

    try {
      await updateRequestMutation.mutateAsync({
        id: request.id,
        exchangeRate: numericValue,
      });
      toast.success('Tipo de cambio actualizado');
    } catch (error) {
      setStoreExchangeRate(previousExchangeRate);
      toast.error('Error al actualizar el tipo de cambio');
      throw error;
    }
  };
  
  const subTotal = request?.sub_total ?? 0;
  const weight = request?.weight ?? 0;
  
  // Ganancia de productos (proporcionada por el store/backend)
  const productsProfitUSD = request?.productsProfit ?? 0;
  
  // Ganancia adicional (guardada en request.profit en USD)
  const additionalProfitUSD = request?.profit ?? 0;
  
  // Ganancia total = ganancia de productos + ganancia adicional
  const totalProfitUSD = productsProfitUSD + additionalProfitUSD;
  
  // Desglose de costos de envío (config)
  const SHIPPING_PER_KG = PricingConstants.DEFAULT_SHIPPING_RATE;
  const PROCESSING_FEE = PricingConstants.PROCESSING_FEE;
  const HANDLING_FEE = PricingConstants.MOBILITY_FEE;
  
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

  // Handlers
  const handleFinalPriceSave = async (nextValue: string) => {
    const numericValue = parseFloat(nextValue);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      toast.error('Precio inválido');
      throw new Error('Invalid final price');
    }

    const safeValue = Math.max(numericValue, totalCostsUSD);
    setFinalPrice(safeValue);
    toast.success('Precio final actualizado');
  };

  const handleProfitSave = async (nextValue: string) => {
    const numericValue = parseFloat(nextValue);
    if (Number.isNaN(numericValue) || numericValue < 0) {
      toast.error('Ganancia inválida');
      throw new Error('Invalid profit');
    }

    // Calcular nuevo precio final basado en la ganancia deseada
    const newFinalPrice = totalCostsUSD + numericValue;
    setFinalPrice(newFinalPrice);
    toast.success('Ganancia actualizada');
  };

  const handleAdditionalProfitSave = async (nextValue: string) => {
    const numericValue = parseFloat(nextValue);
    if (Number.isNaN(numericValue)) {
      toast.error('Valor inválido');
      throw new Error('Invalid additional profit');
    }

    // Calcular nuevo precio final: costos + ganancia de productos + ajuste
    const newFinalPrice = totalCostsUSD + productsProfitUSD + numericValue;
    setFinalPrice(newFinalPrice);
    toast.success('Ajuste de ganancia actualizado');
  };


  return (
    <>
      {/* TODO: Remove debug block once request data flow is verified */}
      <div className="mb-4 rounded-lg border border-dashed border-yellow-500/40 bg-yellow-50/80 p-4 text-xs font-mono text-yellow-900">
        <p className="mb-2 font-semibold">[Debug] TotalSummaryCard snapshot</p>
        <pre className="max-h-60 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(
            {
              request,
              shippingCostsUSD,
            },
            null,
            2
          )}
        </pre>
      </div>
      <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Resumen</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Desglose ordenado */}
        <div className="space-y-3">
          {/* Tipo de cambio */}
          <InlineEditableValue
            label="Tipo de cambio"
            displayValue={`${exchangeRate.toFixed(4)}`}
            subtitle="USD → PEN"
            initialValue={exchangeRate.toFixed(4)}
            inputMode="decimal"
            align="right"
            inputWidthClassName="w-32"
            onSave={handleExchangeRateSave}
          />

          {/* Subtotal */}
          <DisplayValue
            label="Subtotal"
            displayValue={`$${subTotal.toFixed(2)}`}
            subtitle={`S/. ${subTotalPEN.toFixed(2)}`}
            align="right"
            tooltip="Suma de los precios base de todos los productos"
          />

          {/* Envío con Dropdown */}
          <DropdownValue
            label="Envío"
            displayValue={`$${totalShippingCost.toFixed(2)}`}
            subtitle={`S/. ${shippingCostsPEN.toFixed(2)}`}
            tooltip="Costos de envío: peso + tramitación + movilidad"
          >
            <div className="text-xs text-muted-foreground mb-2">Peso total: {weight.toFixed(2)} kg</div>
            
            <DisplayValue
              label={`${weight.toFixed(2)} kg × $7`}
              displayValue={`$${shippingByWeight.toFixed(2)}`}
              subtitle={`S/. ${shippingByWeightPEN.toFixed(2)}`}
              align="right"
              className="text-xs"
              tooltip="Costo de envío basado en el peso del paquete"
            />
            
            <DisplayValue
              label="Tramitación"
              displayValue={`$${PROCESSING_FEE.toFixed(2)}`}
              subtitle={`S/. ${processingFeePEN.toFixed(2)}`}
              align="right"
              className="text-xs"
              tooltip="Tarifa fija por procesamiento de la solicitud"
            />
            
            <DisplayValue
              label="Movilidad"
              displayValue={`$${HANDLING_FEE.toFixed(2)}`}
              subtitle={`S/. ${handlingFeePEN.toFixed(2)}`}
              align="right"
              className="text-xs"
              tooltip="Tarifa fija por manejo y transporte local"
            />
          </DropdownValue>

          {/* Ganancia con edición y desglose */}
          <DropdownValue
            label="Ganancia"
            displayValue={`$${totalProfitUSD.toFixed(2)}`}
            subtitle={`S/. ${totalProfitPEN.toFixed(2)}`}
            tooltip="Ganancia total: incluye ganancia de productos + ajustes"
            editable
            initialValue={totalProfitUSD.toFixed(2)}
            inputMode="decimal"
            inputWidthClassName="w-32"
            onSave={handleProfitSave}
            valueClassName="text-green-600"
          >
            {productsProfitUSD > 0 && (
              <>
                <DisplayValue
                  label="Ganancia de productos"
                  displayValue={`$${productsProfitUSD.toFixed(2)}`}
                  subtitle={`S/. ${productsProfitPENDisplay.toFixed(2)}`}
                  align="right"
                  className="text-xs"
                  tooltip="Ganancia calculada automáticamente de los productos"
                />
                
                {/* Ajuste de ganancia */}
                <div className="text-xs">
                  <InlineEditableValue
                    label="Ajuste de ganancia"
                    displayValue={`${additionalProfitUSD > 0 ? '+' : ''}$${additionalProfitUSD.toFixed(2)}`}
                    subtitle={`${additionalProfitUSD > 0 ? '+' : ''}S/. ${additionalProfitPEN.toFixed(2)}`}
                    initialValue={additionalProfitUSD.toFixed(2)}
                    inputMode="decimal"
                    align="right"
                    inputWidthClassName="w-24"
                    onSave={handleAdditionalProfitSave}
                    valueClassName={additionalProfitUSD > 0 ? 'text-green-600' : additionalProfitUSD < 0 ? 'text-red-600' : ''}
                    className="text-xs"
                  />
                </div>
              </>
            )}
          </DropdownValue>
        </div>

        <Separator />

        {/* Precio Final */}
        <InlineEditableValue
          label="Precio Final"
          displayValue={`$${finalPriceUSD.toFixed(2)}`}
          subtitle={`S/. ${finalPricePEN.toFixed(2)}`}
          initialValue={finalPriceUSD.toFixed(2)}
          inputMode="decimal"
          align="right"
          inputWidthClassName="w-40"
          inputPrefix="$"
          onSave={handleFinalPriceSave}
        />
      </CardContent>
    </Card>
    </>
  )
}
