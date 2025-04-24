"use client"

import { PricingCalculator } from "@/components/pricing-calculator"

export default function CalculatorPage() {

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Calculadora de Precios</h1>
      <PricingCalculator
        className="max-w-3xl mx-auto"
      />
    </div>
  )
}
