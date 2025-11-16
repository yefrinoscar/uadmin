"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Save, Loader2, XCircle } from "lucide-react"
import { RequestDetailsCard } from "./RequestDetailsCard"
import { TotalSummaryCard } from "./TotalSummaryCard"
import ProductList from "./ProductList"
import { useTRPC } from '@/trpc/client';
import { useMutation, useSuspenseQuery, useQueryClient, QueryKey } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useRequestDetailStore } from "@/store/requestDetailStore"
import { BackButton } from "@/components/back"
import { PurchaseRequestStatus } from "../../types"
import { StatusWorkflow, getAvailableStatusTransitions } from "./StatusWorkflow";
import { RequestPreviewDrawer } from "./RequestPreviewDrawer";
import { PurchaseRequest } from "@/trpc/api/routers/requests"

interface RequestDetailClientPageProps {
  id: string
}

function setQueryDataTypesafe<TData>(
  queryClient: ReturnType<typeof useQueryClient>,
  queryKey: QueryKey,
  updater: TData | ((oldData: TData | undefined) => TData)
) {
  queryClient.setQueryData<TData>(queryKey, updater);
}

export function RequestDetail({ id }: RequestDetailClientPageProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    request,
    setRequest,
  } = useRequestDetailStore();

  // Local state for UI and editing
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // tRPC queries and mutations
  const requestQueryOptions = trpc.requests.getById.queryOptions({ id });
  const { data: requestData, refetch } = useSuspenseQuery(requestQueryOptions);
  
  const updateRequestMutation = useMutation(
    trpc.requests.updateRequest.mutationOptions({
      onMutate: async (variables) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries(requestQueryOptions);
        
        // Snapshot the previous value
        const previousData = queryClient.getQueryData(requestQueryOptions.queryKey);
        
        // Optimistically update to the new value
        setQueryDataTypesafe<PurchaseRequest>(queryClient, requestQueryOptions.queryKey, (old) => ({
          ...old,
          price: variables.price,
          final_price: variables.finalPrice,
          response: variables.response
        } as PurchaseRequest));
        
        // Return a context object with the snapshotted value
        return { previousData, variables };
      },
      onSuccess: () => {
        toast.success("Cambios guardados correctamente", {
          id: "save-request",
          duration: 3000
        });
        // Explicitly update the store with the saved values
        // This helps ensure the store reflects the just-saved state 
        // before the refetch completes and the main useEffect runs.
       
      },
      onError: (error, variables, context) => {
        console.error("Error updating request:", error);
        toast.error("Error", {
          description: "No se pudo guardar los cambios",
          id: "save-request-error"
        });
        
        // Rollback to the previous value
        if (context?.previousData) {
          queryClient.setQueryData(requestQueryOptions.queryKey, context.previousData);
        }
      },
      onSettled: () => {
        // Refetch after error or success to ensure consistency
        queryClient.invalidateQueries(requestQueryOptions);
      }
    })
  );

  const updateStatusMutation = useMutation(
    trpc.requests.updateStatus.mutationOptions({
    onSuccess: () => {
      toast.success("Estado actualizado correctamente");
      refetch(); // Refetch the data after mutation
      setIsUpdatingStatus(false);
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast.error("Error", {
        description: "No se pudo actualizar el estado",
      });
      setIsUpdatingStatus(false);
    },
  }));

  useEffect(() => {
    if (requestData) {
      setRequest(requestData);
    }
  }, [requestData]);

  // Effect to determine if there are unsaved changes by comparing store state with React Query data
  useEffect(() => {
    // Ensure both request from store and requestData from query are available
    if (!request || !requestData) {
      setHasUnsavedChanges(false);
      return;
    }

    const changedFieldsLog: Array<{
      field: keyof PurchaseRequest;
      oldValue: PurchaseRequest[keyof PurchaseRequest] | undefined | null;
      newValue: PurchaseRequest[keyof PurchaseRequest] | undefined | null;
    }> = [];

    // Define which fields of PurchaseRequest to compare
    const fieldsToCompare: (keyof PurchaseRequest)[] = ['currency', 'exchange_rate', 'price', 'final_price'];

    for (const field of fieldsToCompare) {
      const oldValue = requestData[field];
      const newValue = request[field];

      if (newValue !== oldValue) {
        changedFieldsLog.push({
          field,
          oldValue: oldValue as PurchaseRequest[typeof field] | undefined | null, // Type assertion for clarity
          newValue: newValue as PurchaseRequest[typeof field] | undefined | null, // Type assertion for clarity
        });
      }
    }

    const const_hasActualChanges = changedFieldsLog.length > 0;
    setHasUnsavedChanges(const_hasActualChanges);

    if (const_hasActualChanges) {
      console.log('Request details have unsaved changes:');
      changedFieldsLog.forEach(change => {
        console.log(`  - ${change.field}: from '${change.oldValue}' to '${change.newValue}'`);
      });
    } else {
      // Optional: Log if there are no changes, for clarity during development
      // console.log('Request details are in sync with fetched data.');
    }

  }, [request, requestData]);

  const handleSaveChanges = async () => {
    if (!request?.id) {
      toast.error("Error", { description: "ID de solicitud no encontrado." });
      return;
    }
    setIsSaving(true);
    try {
      console.log('request1', request);
      await updateRequestMutation.mutateAsync({
        id: request.id,
        price: request.price ?? 0,
        finalPrice: request.final_price ?? 0,
        currency: request.currency ?? undefined,
        exchangeRate: request.exchange_rate ?? undefined,
      });
      // On success, mutation's onSuccess (toast) and onSettled (refetch) run.
      // The refetch will update requestData, and if the save was successful,
      // the store (via `setRequest(requestData)`) and requestData will align,
      // causing hasUnsavedChanges to become false.
    } catch (error) {
      console.error("Failed to save changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: PurchaseRequestStatus) => {
    if (!request?.id) return;
    
    setIsUpdatingStatus(true);
    
    try {
      await updateStatusMutation.mutateAsync({
        id: request.id,
        status: newStatus
      });
    } catch {
      setIsUpdatingStatus(false);
    }
  };


  return (
    <div className="space-y-4">

      <div className="flex justify-between items-start">
        <div className="flex space-x-2 items-center"> 
          <BackButton />
          <h2 className="text-2xl font-bold tracking-tight">Detalle de pedido</h2>
        </div>

        <div className="flex space-x-3 items-center">
          {/* Cancel Order Button */}
          {requestData?.status && 
           getAvailableStatusTransitions(requestData.status as PurchaseRequestStatus).includes('cancelled') && 
           requestData.status !== 'cancelled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => !isUpdatingStatus && handleStatusChange('cancelled')}
              disabled={isUpdatingStatus}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
            >
              {isUpdatingStatus ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Cancelar pedido
            </Button>
          )}

          {/* Save Changes Button */}
          {hasUnsavedChanges && (
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              variant="default"
              className="transition-all"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar Cambios
            </Button>
          )}
          
          {/* Preview Drawer Component */}
          <RequestPreviewDrawer />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {requestData && requestData.status && (
            <StatusWorkflow 
              currentActualStatus={requestData.status} 
              isUpdatingStatus={isUpdatingStatus} 
              onStatusChange={handleStatusChange} 
            />
          )}
          {requestData && <RequestDetailsCard request={requestData} />}
          {requestData && <ProductList requestId={id} products={requestData.products} />}
        </div>
        <div className="lg:col-span-1 space-y-4">
          <TotalSummaryCard />
        </div>
      </div>
    </div>
  )
}