"use client";

import React, { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InlineEditableValue } from "./inline-editable-value";

interface DropdownValueProps {
  label: string;
  displayValue: string;
  subtitle?: string;
  tooltip?: string;
  children?: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  // Props para modo editable
  editable?: boolean;
  initialValue?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  inputWidthClassName?: string;
  valueClassName?: string;
  onSave?: (nextValue: string) => Promise<void> | void;
}

export const DropdownValue: React.FC<DropdownValueProps> = ({
  label,
  displayValue,
  subtitle,
  tooltip,
  children,
  defaultExpanded = false,
  className,
  editable = false,
  initialValue,
  inputMode = "text",
  inputWidthClassName = "w-32",
  valueClassName,
  onSave,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasChildren = Boolean(children);

  return (
    <div className={className}>
      <div className="w-full flex items-center justify-between">
        {/* Label con chevron (solo si hay children) */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <span className="text-sm text-muted-foreground">{label}</span>
            <ChevronDown
              className={cn(
                "h-3 w-3 text-muted-foreground transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        ) : (
          <span className="text-sm text-muted-foreground">{label}</span>
        )}

        {/* Valor - editable o no editable */}
        {editable && onSave && initialValue !== undefined ? (
          <div className="flex-1 flex justify-end">
            <InlineEditableValue
              label=""
              displayValue={displayValue}
              subtitle={subtitle}
              tooltip={tooltip}
              initialValue={initialValue}
              inputMode={inputMode}
              align="right"
              inputWidthClassName={inputWidthClassName}
              onSave={onSave}
              valueClassName={valueClassName}
            />
          </div>
        ) : tooltip ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-right px-2 py-1 rounded hover:bg-muted/50 transition-colors cursor-help">
                  <div className={cn("font-semibold", valueClassName)}>
                    {displayValue}
                  </div>
                  {subtitle && (
                    <div className="text-xs text-muted-foreground">{subtitle}</div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="text-right px-2 py-1 rounded hover:bg-muted/50 transition-colors">
            <div className={cn("font-semibold", valueClassName)}>
              {displayValue}
            </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>
        )}
      </div>

      {/* Detalles expandibles */}
      {isExpanded && children && (
        <div className="mt-2 ml-4 pl-3 border-l-2 border-border space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
};
