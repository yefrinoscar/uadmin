"use client";

import React from 'react';
import { cn } from "@/lib/utils";
import { Check, XCircle, Clock, Package, Truck, CheckCircle, AlertCircle } from "lucide-react";
import { PurchaseRequestStatus, purchaseRequestStatusLabels } from "../../types";

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
const getStatusLocalIcon = (status: PurchaseRequestStatus, size: string = "h-4 w-4"): React.ReactElement | null => {
  switch (status) {
    case "pending": return <Clock className={size} />;
    case "in_progress": return <Package className={size} />;
    case "in_transit": return <Truck className={size} />;
    case "delivered": return <CheckCircle className={size} />;
    case "completed": return <CheckCircle className={size} />;
    case "cancelled": return <XCircle className={size} />;
    default: return <AlertCircle className={size} />;
  }
};

interface StatusWorkflowProps {
  currentActualStatus: PurchaseRequestStatus;
  isUpdatingStatus: boolean;
  onStatusChange: (newStatus: PurchaseRequestStatus) => Promise<void>;
}

export { getAvailableStatusTransitions };

export const StatusWorkflow: React.FC<StatusWorkflowProps> = ({
  currentActualStatus,
  isUpdatingStatus,
  onStatusChange,
}) => {
  const [animatingStatus, setAnimatingStatus] = React.useState<PurchaseRequestStatus | null>(null);
  
  const statusOrder: PurchaseRequestStatus[] = ["pending", "in_progress", "in_transit", "delivered", "completed"];
  const currentStatusIndex = statusOrder.indexOf(currentActualStatus);
  const availableTransitions = getAvailableStatusTransitions(currentActualStatus);

  // Trigger animation when status changes
  React.useEffect(() => {
    if (isUpdatingStatus) {
      setAnimatingStatus(currentActualStatus);
    } else {
      // Clear animation after a delay when update completes
      const timer = setTimeout(() => setAnimatingStatus(null), 600);
      return () => clearTimeout(timer);
    }
  }, [isUpdatingStatus, currentActualStatus]);

  const workflowSteps = statusOrder.map((status) => {
    const isCurrent = status === currentActualStatus;
    const isPast = currentStatusIndex > -1 && statusOrder.indexOf(status) < currentStatusIndex;
    const isAvailable = availableTransitions.includes(status) && !isCurrent && !isPast;
    const isFuture = !isCurrent && !isPast && !isAvailable;
    const isAnimating = animatingStatus === status && !isUpdatingStatus;
    
    return {
      status,
      label: getStatusLocalLabel(status),
      isCurrent,
      isPast,
      isAvailable,
      isFuture,
      isAnimating,
    };
  });

  return (
    <div className="relative">
      {/* Timeline horizontal minimalista */}
      {currentActualStatus !== 'cancelled' ? (
        <div className="bg-muted/30 rounded-lg p-3.5 border border-border/50">
          <div className="flex items-center">
            {workflowSteps.map((step, index) => (
              <React.Fragment key={step.status}>
                <button
                  onClick={() => step.isAvailable && !isUpdatingStatus && onStatusChange(step.status)}
                  disabled={!step.isAvailable || isUpdatingStatus || step.isFuture}
                  className={cn(
                    "group relative flex flex-col items-center gap-1.5 transition-all min-w-0",
                    step.isAvailable && !isUpdatingStatus && "cursor-pointer hover:-translate-y-0.5",
                    !step.isAvailable && !step.isCurrent && !step.isPast && "cursor-default"
                  )}
                  aria-label={`Cambiar estado a ${step.label}`}
                >
                  {/* Dot indicator */}
                  <div className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 shrink-0",
                    step.isCurrent && "bg-[#4D2DDA] border-[#4D2DDA] text-white shadow-md shadow-[#4D2DDA]/30",
                    step.isPast && "bg-[#4D2DDA]/20 border-[#4D2DDA]/50 text-[#4D2DDA]",
                    step.isAvailable && "bg-background border-border text-muted-foreground group-hover:border-[#4D2DDA] group-hover:text-[#4D2DDA] group-hover:shadow-sm",
                    step.isFuture && "bg-background border-border/40 text-muted-foreground/30",
                    step.isAnimating && "animate-[pulse_0.6s_ease-in-out] scale-110"
                  )}>
                    {/* Ripple effect when animating */}
                    {step.isAnimating && (
                      <div className="absolute inset-0 rounded-full bg-[#4D2DDA] animate-ping opacity-75" />
                    )}
                    <div className="relative z-10">
                      {step.isPast ? (
                        <Check className={cn(
                          "w-4 h-4 stroke-[2.5] transition-transform duration-300",
                          step.isAnimating && "scale-110"
                        )} />
                      ) : (
                        <div className={cn(
                          "transition-transform duration-300",
                          step.isAnimating && "scale-110"
                        )}>
                          {getStatusLocalIcon(step.status, "w-4 h-4")}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-xs font-medium transition-colors text-center leading-tight max-w-[70px]",
                    step.isCurrent && "text-[#4D2DDA] font-semibold",
                    step.isPast && "text-muted-foreground",
                    step.isAvailable && "text-foreground group-hover:text-[#4D2DDA]",
                    step.isFuture && "text-muted-foreground/50"
                  )}>
                    {step.label}
                  </span>
                </button>
                
                {/* Connector line */}
                {index < workflowSteps.length - 1 && (
                  <div className="flex-1 px-2 flex items-center">
                    <div className={cn(
                      "h-[2px] w-full rounded-full transition-all duration-500",
                      step.isPast ? "bg-[#4D2DDA]/50" : "bg-border/40"
                    )}></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        /* Estado cancelado minimalista */
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3.5">
          <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium">Este pedido ha sido cancelado</p>
          </div>
        </div>
      )}
    </div>
  );
};
