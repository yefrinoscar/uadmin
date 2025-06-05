"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ColorPickerCircleProps {
  color: string
  onChange: (color: string) => void
  disabled?: boolean
  className?: string
}

export function ColorPickerCircle({ 
  color, 
  onChange, 
  disabled = false,
  className 
}: ColorPickerCircleProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempColor, setTempColor] = React.useState(color)

  React.useEffect(() => {
    setTempColor(color)
  }, [color])

  const handleColorChange = (newColor: string) => {
    setTempColor(newColor)
    onChange(newColor)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-12 h-12 rounded-full p-0 border-2 border-gray-300 hover:border-gray-400 transition-colors",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          disabled={disabled}
          style={{ backgroundColor: color }}
        >
          <span className="sr-only">Seleccionar color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="text-sm font-medium">Seleccionar Color</div>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: tempColor }}
            />
            <Input
              type="color"
              value={tempColor}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-20 h-10 p-1 border rounded"
            />
          </div>
          <div className="text-xs text-gray-500">
            Código: {tempColor}
          </div>
          
          {/* Preset colors */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Colores populares:</div>
            <div className="grid grid-cols-6 gap-2">
              {[
                "#ffffff", "#000000", "#ef4444", "#f97316", 
                "#eab308", "#22c55e", "#3b82f6", "#8b5cf6",
                "#ec4899", "#06b6d4", "#84cc16", "#f59e0b"
              ].map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => handleColorChange(presetColor)}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  style={{ backgroundColor: presetColor }}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 