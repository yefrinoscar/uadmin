"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
  minDate?: Date
}

export function DateTimePicker({ date, setDate, disabled, minDate }: DateTimePickerProps) {
  const [selectedTime, setSelectedTime] = React.useState<string>(
    date ? format(date, "HH:mm") : "00:00"
  )

  const [isOpen, setIsOpen] = React.useState(false)

  // Update the date when time changes
  const handleTimeChange = React.useCallback(
    (time: string) => {
      setSelectedTime(time)
      if (date) {
        const [hours, minutes] = time.split(":")
        const newDate = new Date(date)
        newDate.setHours(parseInt(hours, 10))
        newDate.setMinutes(parseInt(minutes, 10))
        setDate(newDate)
      }
    },
    [date, setDate]
  )

  // Update time when date changes
  React.useEffect(() => {
    if (date) {
      setSelectedTime(format(date, "HH:mm"))
    }
  }, [date])

  const times = React.useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = [0, 15, 30, 45]
    
    if (minDate && date?.toDateString() === minDate.toDateString()) {
      // If selecting same day as minDate, only show times after minDate
      return hours.flatMap(hour => {
        if (hour < minDate.getHours()) return []
        return minutes
          .filter(minute => hour > minDate.getHours() || minute > minDate.getMinutes())
          .map(minute => 
            `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          )
      })
    }

    return hours.flatMap(hour => 
      minutes.map(minute => 
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      )
    )
  }, [minDate, date])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(date, "PPP HH:mm", { locale: es })
          ) : (
            <span>Seleccionar fecha y hora</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => {
            if (newDate) {
              const updatedDate = new Date(newDate)
              if (date) {
                // Keep the current time when changing date
                updatedDate.setHours(date.getHours())
                updatedDate.setMinutes(date.getMinutes())
              } else if (minDate && newDate.toDateString() === minDate.toDateString()) {
                // If selecting minDate, set time to current minDate time
                updatedDate.setHours(minDate.getHours())
                updatedDate.setMinutes(minDate.getMinutes())
              }
              setDate(updatedDate)
            }
          }}
          initialFocus
          locale={es}
          disabled={disabled}
        />
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedTime}
              onValueChange={handleTimeChange}
              disabled={!date}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Seleccionar hora" />
              </SelectTrigger>
              <SelectContent className="h-[200px]">
                {times.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 