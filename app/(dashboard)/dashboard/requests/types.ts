// app/(dashboard)/dashboard/requests/types.ts
export const purchaseRequestStatuses = [
  "pending",
  "in_progress",
  "in_transit",
  "completed",
  "cancelled",
  "delivered",
] as const;

export type PurchaseRequestStatus = typeof purchaseRequestStatuses[number];

export const purchaseRequestStatusLabels: Record<PurchaseRequestStatus, string> = {
  pending: "Pendiente",
  in_progress: "En Proceso",
  in_transit: "En Camino",
  completed: "Completado",
  cancelled: "Cancelado",
  delivered: "Entregado",
};

// Optional: if you need a version for Zod schemas on the frontend that matches this
// import { z } from 'zod';
// export const PurchaseRequestStatusSchemaFrontend = z.enum(purchaseRequestStatuses);
