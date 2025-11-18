"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DisplayValueProps {
  label: string;
  displayValue: string;
  subtitle?: string;
  tooltip?: string;
  align?: "left" | "right";
  className?: string;
  valueClassName?: string;
  subtitleClassName?: string;
  showHover?: boolean;
}

export const DisplayValue: React.FC<DisplayValueProps> = ({
  label,
  displayValue,
  subtitle,
  tooltip,
  align = "right",
  className,
  valueClassName,
  subtitleClassName,
  showHover = true,
}) => {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className="text-sm text-muted-foreground font-semibold">{label}</span>
      {(
        <div
          className={cn(
            "text-right px-2 py-1 rounded transition-colors",
            showHover && "hover:bg-muted/50"
          )}
        >
          <div
            className={cn(
              "font-semibold transition-colors",
              valueClassName
            )}
          >
            {displayValue}
          </div>
          {subtitle && (
            <div className={cn("text-xs text-muted-foreground", subtitleClassName)}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
