"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InlineEditableValueProps {
  label: string;
  displayValue: string;
  subtitle?: string;
  tooltip?: string;
  initialValue: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: React.HTMLInputTypeAttribute;
  align?: "left" | "right";
  inputPrefix?: string;
  inputWidthClassName?: string;
  className?: string;
  valueClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
  onSave: (nextValue: string) => Promise<void> | void;
}

export const InlineEditableValue: React.FC<InlineEditableValueProps> = ({
  label,
  displayValue,
  subtitle,
  tooltip,
  initialValue,
  onSave,
  inputMode = "text",
  type = "text",
  align = "right",
  inputPrefix,
  inputWidthClassName = "w-32",
  className,
  valueClassName,
  inputClassName,
  disabled,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(initialValue);
    }
  }, [initialValue, isEditing]);

  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        cancelEdit();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const cancelEdit = () => {
    setDraftValue(initialValue);
    setIsEditing(false);
  };

  const handleStartEditing = () => {
    if (disabled) return;
    setDraftValue(initialValue);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(draftValue);
      setIsEditing(false);
    } catch (error) {
      // Keep editing so the user can fix the value
    } finally {
      setSaving(false);
    }
  };

  return isEditing ? (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        className
      )}
      ref={containerRef}
    >
      <span className="text-sm text-muted-foreground font-semibold">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative">
          {inputPrefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {inputPrefix}
            </span>
          )}
          <input
            ref={inputRef}
            type={type}
            inputMode={inputMode}
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelEdit();
              }
            }}
            className={cn(
              "px-3 py-1.5 text-sm font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
              inputPrefix ? "pl-8" : "",
              align === "right" ? "text-right" : "text-left",
              inputWidthClassName,
              inputClassName
            )}
            disabled={saving}
          />
        </div>
      </div>
    </div>
  ) : (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-sm text-muted-foreground font-semibold">{label}</span>
      {(
        <button
          onClick={handleStartEditing}
          className={cn(
            "group text-right px-2 py-1 rounded hover:bg-muted/50 transition-colors",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
          disabled={disabled}
        >
          <div
            className={cn(
              "font-semibold border-b border-dashed border-transparent group-hover:border-primary/30 transition-colors",
              valueClassName
            )}
          >
            {displayValue}
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          )}
        </button>
      )}
    </div>
  );
};
