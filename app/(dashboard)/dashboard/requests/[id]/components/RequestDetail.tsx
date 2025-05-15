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
import { StatusWorkflow } from "./StatusWorkflow";
import { RequestPreviewDrawer } from "./RequestPreviewDrawer";

interface RequestDetailClientPageProps {
  id: string
}

export function RequestDetail({ id }: RequestDetailClientPageProps) {
  const trpc = useTRPC();

  // Get state and actions from Zustand store
  const {
    request,
    finalPriceUSD,
    totalGeneralUSD,
    getFinalPricePEN,
    getTotalGeneralPEN,

    setRequest,
    setProducts
  } = useRequestDetailStore();

  // Local state for UI and editing
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [responseText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // tRPC queries and mutations
  const requestQueryOptions = trpc.requests.getById.queryOptions({ id });
  const { data: requestData, refetch } = useSuspenseQuery(requestQueryOptions);

  const updateRequestMutation = useMutation(
    trpc.requests.updateRequest.mutationOptions({
      onSuccess: () => {
        toast.success("Cotización y precios guardados correctamente");
        refetch(); // Refetch the data after mutation
        setIsSaving(false);
      },
      onError: (error) => {
        console.error("Error updating request:", error);
        toast.error("Error", {
          description: "No se pudo actualizar la respuesta y los precios",
        });
        setIsSaving(false);
      },
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

  const sendEmailMutation = useMutation(
    trpc.requests.sendEmail.mutationOptions({
      onSuccess: () => {
        toast.success("Email enviado correctamente");
        refetch(); // Refetch data to update request.email_sent status
        setIsSendingEmail(false);
      },
      onError: (error) => {
        toast.error("Error al enviar el email");
        console.error("Error sending email:", error);
        setIsSendingEmail(false);
      }
    })
  );


  // Effect to determine if there are unsaved changes
  useEffect(() => {
    if (!request) { // If request is not yet loaded from DB
      setHasUnsavedChanges(false);
      return;
    }

    const totalPriceInRequest = typeof request.price === 'number' ? request.price : 0;
    const finalPriceInRequest = typeof request.final_price === 'number' ? request.final_price : 0;
    const epsilon = 0.001;
    const totalPriceChanged = Math.abs(totalGeneralUSD - totalPriceInRequest) > epsilon;
    const finalPriceChanged = Math.abs(finalPriceUSD - finalPriceInRequest) > epsilon;
    
    const newHasUnsavedChanges = totalPriceChanged || finalPriceChanged;

    // Detailed log for debugging what changed
    // if (newHasUnsavedChanges) {
    //   let changedFields = [];

    //   if (totalPriceChanged) {
    //     changedFields.push(`Total Price (USD): (DB: ${totalPriceInRequest}, Store: ${totalGeneralUSD}, Diff: ${totalGeneralUSD - totalPriceInRequest})`);
    //   }
    //   if (finalPriceChanged) {
    //     changedFields.push(`Final Price (USD): (DB: ${finalPriceInRequest}, Store: ${finalPriceUSD}, Diff: ${finalPriceUSD - finalPriceInRequest})`);
    //   }

    //   console.log('[DEBUG] Unsaved Changes Detected. Fields changed:', changedFields.join('; '));
    // } else if (hasUnsavedChanges && !newHasUnsavedChanges) {
    //   console.log('[DEBUG] Changes have been saved or reverted.');
    // }
    
    setHasUnsavedChanges(newHasUnsavedChanges);

  }, [responseText, totalGeneralUSD, finalPriceUSD, request, hasUnsavedChanges]);

  useEffect(() => {
    if (requestData) {
      setRequest(requestData);

      if (requestData.products && requestData.products.length > 0) {
        setProducts(requestData.products);
      } else {
        setProducts([]);
      }

      const requestWithPrices = requestData;
      
      if (requestWithPrices.final_price !== undefined && requestWithPrices.final_price !== null) {
        useRequestDetailStore.getState().setFinalPriceUSD(requestWithPrices.final_price);
      } else {
        useRequestDetailStore.getState().setFinalPriceUSD(0); // Explicitly set to 0 if null/undefined from DB
      }
      
      // Assuming DB field for totalGeneralUSD is 'price'
      if (requestWithPrices.price !== undefined && requestWithPrices.price !== null) {
        useRequestDetailStore.getState().setTotalGeneralUSD(requestWithPrices.price);
      } else {
        useRequestDetailStore.getState().setTotalGeneralUSD(0); // Explicitly set to 0 if null/undefined from DB
      }
    }
  }, [requestData, setRequest, setProducts]);


  const handleSaveResponse = async () => {
    setIsSaving(true);

    console.log('totalGeneralUSD', totalGeneralUSD);
    console.log('finalPriceUSD', finalPriceUSD);
    console.log('calculated PEN: total=', getTotalGeneralPEN(), 'final=', getFinalPricePEN());

    try {
      await updateRequestMutation.mutateAsync({
        id,
        response: responseText,
        price: totalGeneralUSD, // Save in USD
        finalPrice: finalPriceUSD // Save in USD
      });
    } catch {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!request?.client?.email || !responseText.trim()) {
      toast.warning("No hay respuesta para enviar");
      return;
    }
    setIsSendingEmail(true);

    try {
      await updateRequestMutation.mutateAsync({
        id,
        response: responseText,
        price: totalGeneralUSD, // Save in USD 
        finalPrice: finalPriceUSD // Save in USD
      });

      // Then send the email
      await sendEmailMutation.mutateAsync({
        id,
        email: request.client.email,
        subject: 'Respuesta a tu solicitud de cotización',
        content: responseText
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

  const emailSent = request?.email_sent || false;

  // Effect to warn user if they try to leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        // Standard for most browsers to show a confirmation dialog
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

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
                  disabled={!responseText.trim() || isSendingEmail}
                  className={`transition-all ${!responseText.trim() ? "opacity-50 cursor-not-allowed" : "hover:bg-primary hover:text-primary-foreground"}`}
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
            
            {/* Preview Drawer Component */}
            <RequestPreviewDrawer />
            
            <Button
              onClick={handleSaveResponse}
              disabled={!hasUnsavedChanges || isSaving}
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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {requestData && <RequestDetailsCard request={requestData} />}
          <ProductList requestId={id} initialProducts={requestData?.products} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <TotalSummaryCard />
        </div>
        {/* <div className="lg:col-span-1">
          <ResponseSection
            responseText={responseText}
            calculations={{
              totalUSD: totalGeneralUSD,
              totalPEN: getTotalGeneralPEN()
            }}
            client={request?.client}
            onChangeResponse={setResponseText}
          />
        </div> */}
      </div>
    </div>
  )
}