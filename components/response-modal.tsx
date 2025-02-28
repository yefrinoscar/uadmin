"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Clipboard, Check, DollarSign, Percent, Save, BrainCircuit } from "lucide-react"
import { toast } from "sonner"

type PurchaseRequest = {
  id: string
  description: string
  client: {
    email: string
    phone_number: string
    name?: string
  }
  email?: string
  phone?: string
  name?: string
  assigned_user?: {
    id: string
    name: string
  }
  status?: "pending" | "approved" | "rejected"
  created_at?: string
  updated_at?: string
  price?: number
  response?: string
}

type ResponseModalProps = {
  isOpen: boolean
  onClose: () => void
  request: PurchaseRequest | null
  onSubmit: (id: string, response: string) => void
}

export function ResponseModal({ isOpen, onClose, request, onSubmit }: ResponseModalProps) {
  const [response, setResponse] = useState(request?.response || "")
  const [basePrice, setBasePrice] = useState(request?.price || 0)
  const [exchangeRate, setExchangeRate] = useState(3.7)
  const [shippingFixed] = useState(14) // Fixed $14 value for shipping
  const [mobilityFixed] = useState(5) // Fixed $5 value for mobility
  const [taxPercentage] = useState(7) // Changed to 7%
  const [marginPercentage, setMarginPercentage] = useState(10)
  const [marginPEN, setMarginPEN] = useState(0)
  const [isMarginPercentage, setIsMarginPercentage] = useState(true)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    setIsMarginPercentage(basePrice <= 50)
  }, [basePrice])

  const calculatePrice = () => {
    const shipping = shippingFixed // Use fixed value instead of percentage
    const tax = basePrice * (taxPercentage / 100)
    const mobility = mobilityFixed // Use fixed value instead of percentage
    const margin = isMarginPercentage ? basePrice * (marginPercentage / 100) : 0
    return basePrice + shipping + tax + mobility + margin
  }

  const calculateTotalWithPENMargin = () => {
    const usdTotal = calculatePrice()
    if (!isMarginPercentage) {
      return usdTotal + (marginPEN / exchangeRate)
    }
    return usdTotal
  }

  const generateEmailText = async () => {
    const finalPrice = calculateTotalWithPENMargin()
    const clientName = request?.client?.name || request?.name || "Cliente"
    const prompt = `Generate a professional email response for a purchase request quotation. 
                    Address the client as "${clientName}". The final price is $ ${finalPrice.toFixed(2)} or S/. ${(finalPrice * exchangeRate).toFixed(2)}. 
                    Explain the quotation briefly in simple terms for an average person. Mention that after the product arrives to Miami, 
                    it will take a maximum of 7 days to reach the customer. 
                    Keep the email concise and friendly. Do not mention specific percentages or breakdowns of the costs. Write it in Spanish. Do not include a signature. Make sure the email ends with a period.`

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      console.log(JSON.stringify(response))

      if (!response.ok) {
        throw new Error("Failed to generate email")
      }

      const data = await response.json()
      setResponse(data.email)
    } catch (error) {
      console.log(JSON.stringify(error))
      console.error("Error generating email:", error)
      toast("Error", {
        description: "Error al generar el correo. Por favor, intente nuevamente o escriba su propia respuesta."
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (!response.trim()) return;

    try {
      await navigator.clipboard.writeText(response)
      setCopied(true)
      toast("Copiado al portapapeles", {
        description: "La respuesta ha sido copiada al portapapeles",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
      toast("Error al copiar", {
        description: "No se pudo copiar la respuesta al portapapeles",
        // variant: "destructive",
      })
    }
  }

  // const handleSubmit = () => {
  //   if (request) {
  //     onSubmit(request.id, response)
  //     onClose()
  //   }
  // }

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl min-w-[1200px] w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Respuesta al Pedido</DialogTitle>
        </DialogHeader>

        {/* Client Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6 pb-4">
            <div className="grid grid-cols-3 gap-6 mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                <p className="text-base font-medium">
                  {request.client?.name || request.name || "No disponible"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Correo</p>
                <p className="text-base font-medium">
                  {request.client?.email || request.email || "No disponible"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p className="text-base font-medium">
                  {request.client?.phone_number || request.phone || "No disponible"}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-base font-medium">{request.description}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
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
                      onChange={(e) => setBasePrice(e.target.value === "" ? 0 : Number(e.target.value))}
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

            {/* Right Column - Response */}
            <div className="space-y-6 flex flex-col min-h-[600px]">
              <div className="space-y-4 flex-grow flex flex-col">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Respuesta</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateEmailText}
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-1">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <BrainCircuit className="h-4 w-4" />
                        Generado con IA
                      </span>
                    )}
                  </Button>
                </div>

                <Textarea
                  className="w-full flex-grow resize-none min-h-[400px]"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Ingrese su respuesta..."
                />
              </div>

              <div className="flex justify-end space-x-2 mt-auto">
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  className="gap-1"
                  disabled={!response.trim()}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>

        </div>

        <DialogFooter className="mt-6">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={() => request && onSubmit(request.id, response)}
              className="gap-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium border-0 px-6"
            >
              <Save className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
