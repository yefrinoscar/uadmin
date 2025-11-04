"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { Loader2, Check, XCircle, Clock, Package, Truck, CheckCircle, AlertCircle } from "lucide-react";
import { PurchaseRequestStatus, purchaseRequestStatusLabels } from "../../types";
import { Button } from "@/components/ui/button";
import "./status-workflow.css"; // Assuming this CSS is specific to the workflow

// Helper to get available status transitions
const getAvailableStatusTransitions = (currentStatus: PurchaseRequestStatus | null): PurchaseRequestStatus[] => {
  if (!currentStatus) return [];
  switch (currentStatus) {
    case "pending":
      return ["in_progress", "cancelled"];
    case "in_progress":
      return ["in_transit", "delivered", "cancelled"];
    case "in_transit":
      return ["delivered", "cancelled"];
    case "delivered":
      return ["completed"];
    case "completed":
    case "cancelled":
      return [];
    default:
      return [];
  }
};

// Helper to get status label (already available via import, but kept for consistency if logic was more complex)
const getStatusLocalLabel = (status: PurchaseRequestStatus): string => {
  return purchaseRequestStatusLabels[status] || "Desconocido";
};

// Helper to get status icon
const getStatusLocalIcon = (status: PurchaseRequestStatus): React.ReactElement | null => {
  switch (status) {
    case "pending": return <Clock className="h-5 w-5" />;
    case "in_progress": return <Package className="h-5 w-5" />;
    case "in_transit": return <Truck className="h-5 w-5" />;
    case "delivered": return <CheckCircle className="h-5 w-5" />;
    case "completed": return <CheckCircle className="h-5 w-5" />;
    case "cancelled": return <XCircle className="h-5 w-5" />;
    default: return <AlertCircle className="h-5 w-5" />;
  }
};

interface StatusWorkflowProps {
  currentActualStatus: PurchaseRequestStatus;
  isUpdatingStatus: boolean;
  onStatusChange: (newStatus: PurchaseRequestStatus) => Promise<void>;
}

export const StatusWorkflow: React.FC<StatusWorkflowProps> = ({
  currentActualStatus,
  isUpdatingStatus,
  onStatusChange,
}) => {
  const statusOrder: PurchaseRequestStatus[] = ["pending", "in_progress", "in_transit", "delivered", "completed"];
  const currentStatusIndex = statusOrder.indexOf(currentActualStatus);
  const availableTransitions = getAvailableStatusTransitions(currentActualStatus);

  const workflowSteps = statusOrder.map((status) => {
    const isCurrent = status === currentActualStatus; // Use status for comparison
    const isPast = currentStatusIndex > -1 && statusOrder.indexOf(status) < currentStatusIndex;
    const isAvailable = availableTransitions.includes(status) && !isCurrent && !isPast;
    const isFuture = !isCurrent && !isPast && !isAvailable;
    return {
      status,
      label: getStatusLocalLabel(status),
      isCurrent,
      isPast,
      isAvailable,
      isFuture,
    };
  });

  const progressPercentage = currentStatusIndex >= 0
    ? (currentStatusIndex / (statusOrder.length - 1)) * 100
    : 0;

  const getCurrentStatusColorDot = () => {
    switch (currentActualStatus) {
      case "pending": return "bg-yellow-500 dark:bg-yellow-400";
      case "in_progress":
      case "in_transit": return "bg-[#4D2DDA]";
      case "delivered":
      case "completed": return "bg-gray-500 dark:bg-gray-400";
      case "cancelled": return "bg-red-500 dark:bg-red-400";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm dark:shadow-2xl dark:shadow-gray-950/30 mb-6">
      <div className="mb-8 pb-4 border-b border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Estado Actual del Pedido</p>
        <div className="flex items-center">
          <span className={cn("w-3.5 h-3.5 rounded-full mr-3 ring-2 ring-offset-2 dark:ring-offset-card ring-current", getCurrentStatusColorDot())}></span>
          <h2 className="text-2xl font-bold text-foreground">
            {getStatusLocalLabel(currentActualStatus)}
          </h2>
          {isUpdatingStatus && (
            <Loader2 className="ml-3 h-5 w-5 text-[#4D2DDA] animate-spin" />
          )}
        </div>
      </div>

      {currentActualStatus !== 'cancelled' && (
        <div className="relative mb-10">
          <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full"></div>
          <div
            className="absolute top-5 left-0 h-1 bg-[#4D2DDA] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
          <div className="relative flex justify-between items-start pt-1">
            {workflowSteps.map((step) => (
              <div key={step.status} className="flex flex-col items-center text-center w-[18%] group">
                <button
                  onClick={() => step.isAvailable && !isUpdatingStatus && onStatusChange(step.status)}
                  disabled={!step.isAvailable || isUpdatingStatus || step.isFuture}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 relative mb-2 transition-all duration-300 ease-in-out transform focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-card",
                    step.isCurrent && "bg-[#4D2DDA] border-[#4D2DDA] text-white scale-110 shadow-lg dark:shadow-[#4D2DDA]/30 focus:ring-[#4D2DDA]",
                    step.isPast && "bg-gray-100 text-gray-400 border-gray-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700",
                    step.isAvailable && "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600",
                    step.isFuture && "bg-muted border-gray-300 dark:border-gray-700 text-muted-foreground/50 cursor-not-allowed",
                    isUpdatingStatus && step.isAvailable && "opacity-60 cursor-wait"
                  )}
                  aria-label={`Cambiar estado a ${step.label}`}
                >
                  {step.isPast ? <Check className="w-5 h-5" /> : getStatusLocalIcon(step.status)}
                  {step.isCurrent && <span className="absolute inset-0 rounded-full ring-4 ring-[#4D2DDA]/20 dark:ring-[#4D2DDA]/30 animate-ping once"></span>} 
                  {step.isAvailable && <span className="absolute -top-1 -right-1 w-3 h-3 bg-slate-100 rounded-full border-2 border-card animate-pulse"></span>}
                </button>
                <span className={cn(
                  "text-xs font-medium px-1 leading-tight transition-colors duration-300",
                  step.isCurrent && "text-[#4D2DDA] dark:text-sky-300 font-semibold scale-105",
                  step.isPast && "text-gray-500 dark:text-neutral-500",
                  step.isAvailable && "text-slate-700 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-200",
                  step.isFuture && "text-muted-foreground/60"
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {availableTransitions.includes('cancelled') && currentActualStatus !== 'cancelled' && (
        <div className="mt-8 pt-6 border-t border-border flex flex-col items-center sm:flex-row sm:justify-end">
          <p className="text-sm text-muted-foreground mb-2 sm:mb-0 sm:mr-4 text-center sm:text-left">¿Necesitas anular este pedido?</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => !isUpdatingStatus && onStatusChange('cancelled')}
            disabled={isUpdatingStatus}
            className="border-red-500/70 text-red-500 hover:bg-red-500 hover:text-white dark:border-red-500/50 dark:hover:bg-red-600 dark:hover:border-red-600 dark:hover:text-white group w-full sm:w-auto"
          >
            {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <XCircle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            Cancelar Pedido
          </Button>
        </div>
      )}

      {currentActualStatus === 'cancelled' && (
        <div className="mt-8 pt-6 border-t border-border text-center">
          <div className="inline-flex items-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full px-4 py-2">
            <XCircle className="mr-2 h-5 w-5" />
            <p className="text-sm font-medium">Este pedido ha sido cancelado.</p>
          </div>
        </div>
      )}
    </div>
  );
};
