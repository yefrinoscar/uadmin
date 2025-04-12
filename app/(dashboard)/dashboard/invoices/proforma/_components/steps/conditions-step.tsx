'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProformaStore } from '@/store/proformaStore'

export function ConditionsStep() {
  const { proforma, setConditions } = useProformaStore()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [currency, setCurrency] = useState<string>('S/')
  const [warranty, setWarranty] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const handleConditionsChange = (
    field: string,
    value: string | number | boolean | Date | null
  ) => {
    if (field === 'currency') {
      setCurrency(value as string)
    } else if (field === 'warranty') {
      setWarranty(value as string)
    } else if (field === 'notes') {
      setNotes(value as string)
    } else if (field === 'expiration_date') {
      // Handle via date state
    } else {
      // Only pass fields that exist in the conditions object
      setConditions({
        [field]: value
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    setDate(date)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency">Moneda *</Label>
                <Select
                  value={currency}
                  onValueChange={(value) => handleConditionsChange('currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Seleccione moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="S/">Soles (S/)</SelectItem>
                    <SelectItem value="$">Dólares ($)</SelectItem>
                    <SelectItem value="€">Euros (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="paymentMethod">Método de pago *</Label>
                <Input
                  id="paymentMethod"
                  value={proforma.conditions.paymentMethod || ''}
                  onChange={(e) => handleConditionsChange('paymentMethod', e.target.value)}
                  placeholder="Ej. Transferencia bancaria, 50% adelanto"
                />
              </div>

              <div>
                <Label htmlFor="expiration_date">Fecha de expiración</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {/* {date ? format(date, "PPP") : <span>Seleccionar fecha</span>} */}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="deliveryTime">Tiempo de entrega *</Label>
                <Input
                  id="deliveryTime"
                  value={proforma.conditions.deliveryTime || ''}
                  onChange={(e) => handleConditionsChange('deliveryTime', e.target.value)}
                  placeholder="Ej. 10 días hábiles"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeIGV"
                  checked={proforma.conditions.includeIGV || false}
                  onCheckedChange={(checked) => handleConditionsChange('includeIGV', checked)}
                />
                <Label htmlFor="includeIGV">Incluir IGV (18%)</Label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="warranty">Garantía *</Label>
                <Input
                  id="warranty"
                  value={warranty}
                  onChange={(e) => handleConditionsChange('warranty', e.target.value)}
                  placeholder="Ej. 1 año de garantía"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => handleConditionsChange('notes', e.target.value)}
                  placeholder="Información adicional para el cliente..."
                  rows={6}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 