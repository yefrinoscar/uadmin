'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { 
  PlusCircle, Trash2, Edit, Save, X, 
  PackageOpen 
} from 'lucide-react'
import { useProformaStore } from '@/store/proformaStore'
import { ProformaItem } from '@/types'

export function ItemsStep() {
  const { proforma, addItem, updateItem, removeItem } = useProformaStore()
  const { items, conditions } = proforma
  
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [newItem, setNewItem] = useState<Partial<ProformaItem>>({
    description: '',
    notes: '',
    unit: 'UND',
    quantity: 1,
    unit_price: 0,
    total: 0
  })

  const calculateTotal = (quantity: number, price: number) => {
    return quantity * price
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let newValue: string | number = value
    
    if (name === 'quantity' || name === 'unit_price') {
      newValue = parseFloat(value) || 0
      
      // Calculate total
      const quantity = name === 'quantity' 
        ? newValue 
        : (newItem.quantity || 0)
      
      const price = name === 'unit_price' 
        ? newValue 
        : (newItem.unit_price || 0)
      
      setNewItem(prev => ({
        ...prev,
        [name]: newValue,
        total: calculateTotal(quantity, price)
      }))
    } else {
      setNewItem(prev => ({ ...prev, [name]: newValue }))
    }
  }

  const handleAddItem = () => {
    if (!newItem.description || !newItem.unit || !newItem.quantity || !newItem.unit_price) {
      return
    }
    
    addItem(newItem as ProformaItem)
    
    // Reset form
    setNewItem({
      description: '',
      notes: '',
      unit: 'UND',
      quantity: 1,
      unit_price: 0,
      total: 0
    })
  }

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index)
    setNewItem(items[index])
  }

  const handleUpdateItem = () => {
    if (editingItemIndex === null) return
    
    updateItem(editingItemIndex, newItem)
    setEditingItemIndex(null)
    
    // Reset form
    setNewItem({
      description: '',
      notes: '',
      unit: 'UND',
      quantity: 1,
      unit_price: 0,
      total: 0
    })
  }

  const handleCancelEdit = () => {
    setEditingItemIndex(null)
    
    // Reset form
    setNewItem({
      description: '',
      notes: '',
      unit: 'UND',
      quantity: 1,
      unit_price: 0,
      total: 0
    })
  }

  const getTotals = () => {
    const subtotal = items.reduce((sum: number, item: ProformaItem) => sum + (item.unit_price * item.quantity), 0)
    const tax = conditions.includeIGV ? subtotal * 0.18 : 0
    const total = subtotal + tax
    
    return { subtotal, tax, total }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Input
                id="description"
                name="description"
                value={newItem.description}
                onChange={handleInputChange}
                placeholder="Ej. Laptop Dell XPS 13"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                name="notes"
                value={newItem.notes}
                onChange={handleInputChange}
                placeholder="Ej. Modelo 2023, 16GB RAM"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="unit">Unidad *</Label>
              <Input
                id="unit"
                name="unit"
                value={newItem.unit}
                onChange={handleInputChange}
                placeholder="Ej. UND"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="unit_price">Precio Unitario *</Label>
              <Input
                id="unit_price"
                name="unit_price"
                type="number"
                min="0"
                step="0.01"
                value={newItem.unit_price}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                name="total"
                value={newItem.total}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            {editingItemIndex !== null ? (
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleUpdateItem}>
                  <Save className="mr-2 h-4 w-4" />
                  Actualizar
                </Button>
              </div>
            ) : (
              <Button onClick={handleAddItem}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Item
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {items.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-md">
          <PackageOpen className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-2 text-gray-500">No hay items en la proforma</p>
          <p className="text-sm text-gray-400">Agregue al menos un item para continuar</p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: ProformaItem, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.description}</div>
                      {item.notes && <div className="text-sm text-gray-500">{item.notes}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <span>{proforma.proformaInfo.currency}</span>
                      <span>{item.unit_price.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <span>{proforma.proformaInfo.currency}</span>
                      <span>{item.total.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditItem(index)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(index)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-end mt-4">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal:</span>
                <span>{proforma.proformaInfo.currency} {getTotals().subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IGV (18%):</span>
                <span>{proforma.proformaInfo.currency} {getTotals().tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span className="text-primary">
                  <div className="flex items-center gap-2">
                    <span>{proforma.proformaInfo.currency}</span>
                    <span>{getTotals().total.toFixed(2)}</span>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 