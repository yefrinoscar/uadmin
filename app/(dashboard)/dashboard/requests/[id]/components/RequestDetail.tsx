"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Mail, MessageCircle, Save, Send } from "lucide-react"
import { RequestDetailsCard } from "./RequestDetailsCard"
import { TotalSummaryCard } from "./TotalSummaryCard"
import ProductList from "./ProductList"
import { useTRPC } from '@/trpc/client';
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import "./status-workflow.css"
import { useRequestDetailStore } from "@/store/requestDetailStore"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BackButton } from "@/components/back"
import { PurchaseRequestStatus } from "../../types"
import { RequestDetailDrawer } from "./RequestDetailDrawer"
import { StatusWorkflow } from "./StatusWorkflow";

interface RequestDetailClientPageProps {
  id: string
}

export function RequestDetail({ id }: RequestDetailClientPageProps) {
  const trpc = useTRPC();

  // Get state and actions from Zustand store
  const {
    request,
    response,
    isSendingEmail,
    emailSent,
    products,

    setRequest,
    setResponse,
    setIsSendingEmail,
    setEmailSent,
    setProducts
  } = useRequestDetailStore();

  const [basePrice] = useState<number>(0)

  // tRPC queries and mutations
  const requestQueryOptions = trpc.requests.getById.queryOptions({ id });
  const { data: requestData, refetch } = useSuspenseQuery(requestQueryOptions);

  const updateRequestMutationOptions = trpc.requests.updateRequest.mutationOptions({
    onSuccess: () => {
      toast.success("Respuesta actualizada");
      refetch(); // Refetch the data after mutation
      setIsSaving(false);
    },
    onError: (error) => {
      console.error("Error updating request:", error);
      toast.error("Error", {
        description: "No se pudo actualizar la respuesta",
      });
      setIsSaving(false);
    },
  });

  const updateRequestMutation = useMutation(updateRequestMutationOptions);

  const updateStatusMutationOptions = trpc.requests.updateStatus.mutationOptions({
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
  });

  const updateStatusMutation = useMutation(updateStatusMutationOptions);

  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const sendEmailMutationOptions = trpc.requests.sendEmail.mutationOptions({
    onSuccess: () => {
      toast.success("Email enviado correctamente");
      setEmailSent(true);
      handleSaveResponse();
    },
    onError: (error) => {
      toast.error("Error al enviar el email");
      console.error("Error sending email:", error);
    },
    onSettled: () => {
      setIsSendingEmail(false);
    }
  });

  const sendEmailMutation = useMutation(sendEmailMutationOptions);

  useEffect(() => {
    if (requestData) {
      setRequest(requestData);
      setResponse(requestData.response || "");
      setEmailSent(requestData.email_sent || false);

      if (requestData.products && requestData.products.length > 0) {
        setProducts(requestData.products);
      } else {
        setProducts([]);
      }
    }
  }, [requestData, setRequest, setResponse, setEmailSent, setProducts]);


  const handleSaveResponse = async () => {
    setIsSaving(true);

    try {
      await updateRequestMutation.mutateAsync({
        id,
        response,
        price: basePrice
      });
    } catch {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!request?.client?.email || !response.trim()) {
      toast.warning("No hay respuesta para enviar");
      return;
    }
    setIsSendingEmail(true);

    try {
      await updateRequestMutation.mutateAsync({
        id,
        response,
        price: basePrice
      });

      // Then send the email
      await sendEmailMutation.mutateAsync({
        id,
        email: request.client.email,
        subject: 'Respuesta a tu solicitud de cotización',
        content: response
      });
    } catch {
      // Error handling is in the mutation options
      setIsSendingEmail(false);
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
      // Error handling is in the mutation options
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-start">
        <div className="flex space-x-2 items-center"> 
          <BackButton />
          <h2 className="text-2xl font-bold tracking-tight">Detalle de pedido</h2>
        </div>

        <div className="flex space-x-3">
          {/* Email and Save Buttons */}
          <div className="flex space-x-2">
            {/* Email Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!response.trim() || isSendingEmail}
                  className={`transition-all ${!response.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-primary hover:text-primary-foreground"}`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1">
                {requestData?.client && requestData.client.email && (
                  <DropdownMenuItem
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    className="flex items-center cursor-pointer py-2 px-3 rounded-md hover:bg-secondary transition-colors"
                  >
                    {isSendingEmail ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Mail className={`w-4 h-4 mr-2 ${emailSent ? "text-green-500" : ""}`} />
                    )}
                    {emailSent ? "Email enviado anteriormente" : "Enviar por Email"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  disabled={true}
                  className="flex items-center cursor-not-allowed py-2 px-3 rounded-md opacity-50"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp deshabilitado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {requestData && <RequestDetailDrawer request={requestData} products={products} />}
            
            <Button
              onClick={handleSaveResponse}
              disabled={isSaving}
              className="gap-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium border-0"
            >
              {isSaving ? (
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>


        </div>


      </div>

      {requestData && requestData.status && (
        <StatusWorkflow 
          currentActualStatus={requestData.status} 
          isUpdatingStatus={isUpdatingStatus} 
          onStatusChange={handleStatusChange} 
        />
      )}
      
      {requestData && <RequestDetailsCard request={requestData} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductList requestId={id} initialProducts={requestData?.products} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <TotalSummaryCard />
        </div>
        {/* <div className="lg:col-span-1">
          <ResponseSection
            response={response}
            calculations={calculations}
            client={request?.client}
            onChangeResponse={setResponse}
          />
        </div> */}
      </div>
    </div>
  )
}