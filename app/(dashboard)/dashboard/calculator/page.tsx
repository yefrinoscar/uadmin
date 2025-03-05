"use client"

import { useState } from "react"
import { PricingCalculator } from "@/components/pricing-calculator"

export default function CalculatorPage() {
  const [basePrice, setBasePrice] = useState(0)

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Calculadora de Precios</h1>
      <PricingCalculator
        basePrice={basePrice}
        onBasePriceChange={setBasePrice}
        className="max-w-3xl mx-auto"
      />
    </div>
  )
}
