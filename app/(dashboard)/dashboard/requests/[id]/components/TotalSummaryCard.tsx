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
    setFinalPrice,
    setProfit,
    setExchangeRate: setStoreExchangeRate,
    getCalculatedPricing,
    isManuallyModifiedPrice
  } = useRequestDetailStore();

  // Obtener todos los cálculos del store
  const pricing = getCalculatedPricing();
  
  const {
    subTotal,
    weight,
    shippingByWeight,
    processingFee: PROCESSING_FEE,
    handlingFee: HANDLING_FEE,
    totalShippingCost,
    totalCostsUSD,
    productsProfitUSD,
    additionalProfitUSD,
    totalProfitUSD,
    calculatedPriceUSD,
    finalPriceUSD,
    exchangeRate
  } = pricing;
  
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

    // El store valida que no sea menor a costos y muestra el toast
    setFinalPrice(numericValue);
    
    // Solo mostrar success si el valor fue aceptado (no menor a costos)
    if (numericValue >= totalCostsUSD) {
      toast.success('Precio final actualizado');
    }
  };

  const handleProfitSave = async (nextValue: string) => {
    const numericValue = parseFloat(nextValue);
    if (Number.isNaN(numericValue) || numericValue < 0) {
      toast.error('Ganancia inválida');
      throw new Error('Invalid profit');
    }

    // El store calculará automáticamente el precio final
    const additionalProfit = numericValue - productsProfitUSD;
    setProfit(additionalProfit);
    toast.success('Ganancia actualizada');
  };

  const handleAdditionalProfitSave = async (nextValue: string) => {
    const numericValue = parseFloat(nextValue);
    if (Number.isNaN(numericValue)) {
      toast.error('Valor inválido');
      throw new Error('Invalid additional profit');
    }

    // El store calculará automáticamente el precio final
    setProfit(numericValue);
    toast.success('Ajuste de ganancia actualizado');
  };


  return (
    <>
      {/* Debug: Request snapshot */}
      {/* <div className="mb-4 rounded-lg border border-dashed border-yellow-500/40 bg-yellow-50/80 p-4 text-xs font-mono text-yellow-900">
        <p className="mb-2 font-semibold">[Debug] Request Data</p>
        <pre className="max-h-60 overflow-auto whitespace-pre-wrap">
          {JSON.stringify(
            {
              request,
              pricing,
            },
            null,
            2
          )}
        </pre>
      </div> */}

      {/* Debug: Fórmula del precio final */}
      {/* <div className="mb-4 rounded-lg border border-dashed border-blue-500/40 bg-blue-50/80 p-4 text-xs font-mono text-blue-900">
        <p className="mb-2 font-semibold">[Debug] Fórmula del Precio Final</p>
        <div className="space-y-1">
          <p><strong>Precio Final (USD)</strong> = Subtotal + Envío + Ganancia de Productos + Ganancia Adicional</p>
          <p className="pl-4">= ${subTotal.toFixed(2)} + ${totalShippingCost.toFixed(2)} + ${productsProfitUSD.toFixed(2)} + ${additionalProfitUSD.toFixed(2)}</p>
          <p className="pl-4">= <strong>${finalPriceUSD.toFixed(2)}</strong></p>
          <div className="mt-3 pt-3 border-t border-blue-300">
            <p><strong>Desglose de Envío:</strong></p>
            <p className="pl-4">Peso: {weight.toFixed(2)} kg × $7 = ${shippingByWeight.toFixed(2)}</p>
            <p className="pl-4">Tramitación: ${PROCESSING_FEE.toFixed(2)}</p>
            <p className="pl-4">Movilidad: ${HANDLING_FEE.toFixed(2)}</p>
            <p className="pl-4">Total Envío: ${totalShippingCost.toFixed(2)}</p>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-300">
            <p><strong>Validación:</strong></p>
            <p className="pl-4">Costos Totales: ${totalCostsUSD.toFixed(2)}</p>
            <p className="pl-4">Precio Final ≥ Costos: {finalPriceUSD >= totalCostsUSD ? '✓ Sí' : '✗ No'}</p>
          </div>
        </div>
      </div> */}

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
        <div className="space-y-1.5">
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
          
          {/* Badge inline para volver al precio calculado - solo si fue modificado manualmente */}
          {isManuallyModifiedPrice && Math.abs(finalPriceUSD - calculatedPriceUSD) > 0.01 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Precio modificado</span>
              <button
                onClick={() => {
                  setProfit(0);
                  toast.success('Precio restaurado al calculado');
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors font-medium"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Restaurar (${calculatedPriceUSD.toFixed(2)})
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  )
}
