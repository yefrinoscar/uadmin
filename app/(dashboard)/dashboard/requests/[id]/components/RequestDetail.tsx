"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Copy, Mail, FileDown, MoreVertical, Trash2 } from "lucide-react"
import { RequestDetailsCard } from "./RequestDetailsCard"
import { TotalSummaryCard } from "./TotalSummaryCard"
import ProductList from "./ProductList"
import { useTRPC } from '@/trpc/client';
import { useMutation, useSuspenseQuery, useQueryClient, QueryKey } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

  // tRPC queries and mutations
  const requestQueryOptions = trpc.requests.getById.queryOptions({ id });
  const { data: requestData, refetch } = useSuspenseQuery(requestQueryOptions);
  
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

  // Placeholder handlers for new actions
  const handleDuplicate = () => {
    toast.info("Función de duplicar pedido");
  };

  const handleSendEmail = () => {
    toast.info("Función de enviar email");
  };

  const handleDownloadPDF = () => {
    toast.info("Función de descargar PDF");
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

        <div className="flex space-x-2 items-center">
          {/* Preview Drawer Component */}
          <RequestPreviewDrawer />

          {/* More Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="px-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleDuplicate} disabled>
                <Copy className="mr-2 h-4 w-4" />
                Duplicar pedido
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSendEmail} disabled>
                <Mail className="mr-2 h-4 w-4" />
                Enviar Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <FileDown className="mr-2 h-4 w-4" />
                Descargar PDF
              </DropdownMenuItem>
              {requestData?.status && 
               getAvailableStatusTransitions(requestData.status as PurchaseRequestStatus).includes('cancelled') && 
               requestData.status !== 'cancelled' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => !isUpdatingStatus && handleStatusChange('cancelled')}
                    disabled={isUpdatingStatus}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Cancelar pedido
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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