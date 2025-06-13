"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@/lib/utils"

interface TagInputProps {
  placeholder?: string
  tags: string[]
  setTags: (tags: string[]) => void
  disabled?: boolean
  hasError?: boolean
}

export function TagInput({
  placeholder = "Agregar tag...",
  tags,
  setTags,
  disabled = false,
  hasError = false,
}: TagInputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = React.useState("")

  const handleAddTag = (value: string) => {
    const trimmedValue = value.trim()
    if (trimmedValue && !tags.includes(trimmedValue)) {
      setTags([...tags, trimmedValue])
      setInputValue("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1])
    }
  }

  return (
    <Command className="overflow-visible bg-transparent">
      <div className={cn(
        "group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-[color,box-shadow]",
        hasError && "border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40"
      )}>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRemoveTag(tag)
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={() => handleRemoveTag(tag)}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[120px] inline-flex h-8"
            placeholder={placeholder}
            disabled={disabled}
          />
        </div>
      </div>
    </Command>
  )
} 