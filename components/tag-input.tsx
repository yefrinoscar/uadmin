"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TagInputProps {
  placeholder?: string
  tags: string[]
  setTags: (tags: string[]) => void
  className?: string
  disabled?: boolean
}

export function TagInput({
  placeholder = "Add item...",
  tags,
  setTags,
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const value = inputValue.trim()
      
      if (value) {
        if (tags.includes(value)) {
          setError("Este elemento ya existe")
          // Add error styling temporarily
          inputRef.current?.classList.add("error-shake")
          setTimeout(() => {
            inputRef.current?.classList.remove("error-shake")
          }, 500)
          return
        }
        
        setTags([...tags, value])
        setInputValue("")
        setError(null)
        
        // Clear the contentEditable div
        if (inputRef.current) {
          inputRef.current.textContent = ""
        }
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove the last tag when backspace is pressed and input is empty
      setTags(tags.slice(0, -1))
      setError(null)
    }
  }

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index))
    setError(null)
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex flex-wrap gap-2 p-2 border rounded-md min-h-10 focus-within:ring-1 focus-within:ring-ring",
          error ? "border-destructive" : "",
          disabled && "bg-muted opacity-50 cursor-not-allowed",
          className
        )}
      >
        {tags.map((tag, index) => (
          <Badge key={`${tag}-${index}`} variant="secondary" className="text-xs py-1 px-2">
            {tag}
            {!disabled && (
              <button
                type="button"
                className="ml-1 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(index)
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <div
          ref={inputRef}
          contentEditable={!disabled}
          onKeyDown={handleKeyDown}
          onInput={(e) => {
            setInputValue(e.currentTarget.textContent || "")
            if (error) setError(null)
          }}
          className={cn(
            "flex-1 min-w-[120px] outline-none",
            error ? "text-destructive" : "",
            !inputValue && tags.length === 0 ? "before:content-[attr(data-placeholder)] before:text-muted-foreground" : ""
          )}
          data-placeholder={placeholder}
          style={{ minWidth: "120px" }}
          suppressContentEditableWarning={true}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      
      <style jsx global>{`
        .error-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-2px); }
          40%, 60% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  )
}
