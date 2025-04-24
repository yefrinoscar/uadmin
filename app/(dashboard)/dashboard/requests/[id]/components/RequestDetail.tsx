"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Mail, MessageCircle, Save, Send } from "lucide-react"
import { PricingCalculator } from "@/components/pricing-calculator"
import { RequestDetailsCard } from "./RequestDetailsCard"
import { ResponseSection } from "./ResponseSection"
import ProductList from "./ProductList"
import { useTRPC } from '@/trpc/client';
import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { useRequestDetailStore } from "@/store/requestDetailStore"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BackButton } from "@/components/back"
import { Product } from "@/trpc/api/routers/requests"

interface RequestDetailClientPageProps {
  id: string
}

export function RequestDetail({ id }: RequestDetailClientPageProps) {
  const trpc = useTRPC();

  // Get state and actions from Zustand store
  const {
    request,
    response,
    calculations,
    isSendingEmail,
    emailSent,
    selectedProducts,

    setRequest,
    setResponse,
    setCalculations,
    setIsSendingEmail,
    setEmailSent,
    setSelectedProducts
  } = useRequestDetailStore();

  const [basePrice, setBasePrice] = useState<number>(0)

  // tRPC queries and mutations
  const requestQueryOptions = trpc.requests.getById.queryOptions({ id });
  const { data: requestData, refetch } = useSuspenseQuery(requestQueryOptions);

  // New updateWithProducts mutation
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

  // Add state for saving
  const [isSaving, setIsSaving] = useState(false);

  // New tRPC mutation for sending emails
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

      // If products exist in the request data, update the store
      if (requestData.products && requestData.products.length > 0) {
        setSelectedProducts(requestData.products);
        // Calculate total weight and price from products
        updateTotalsFromProducts(requestData.products);
      } else {
        // Clear products if none exist in the request
        setSelectedProducts([]);
      }
    }
  }, [requestData, setRequest, setResponse, setEmailSent, setSelectedProducts]);

  const updateTotalsFromProducts = (products: Product[]) => {
    const totalPrice = products.reduce((acc, product) => acc + (product.price || 0), 0);
    setBasePrice(totalPrice);
  };

  // Watch for changes in selectedProducts to update calculations
  useEffect(() => {
    if (selectedProducts && selectedProducts.length > 0) {
      updateTotalsFromProducts(selectedProducts);
    }
  }, [selectedProducts]);

  const handleSaveResponse = async () => {
    setIsSaving(true);

    try {
      // Use the updated mutation to save only the response and price
      await updateRequestMutation.mutateAsync({
        id,
        response,
        price: basePrice
      });
    } catch {
      // Error handling is in the mutation options
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
      // First, save the request response
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

  return (
    <div className="space-y-6">

      <div className="flex justify-between">
        <div className="flex space-x-2 items-center"> 
          <BackButton />
          <h2 className="text-2xl font-bold tracking-tight">Detalle de pedido</h2>
        </div>


        <div className="space-x-2">
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
      {requestData && <RequestDetailsCard request={requestData} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProductList requestId={id} initialProducts={requestData?.products} />
        </div>
        <div className="lg:col-span-1">
          <PricingCalculator
            disabled={true}
            onCalculationsChange={setCalculations}
          />
        </div>
        <div className="lg:col-span-1">
          <ResponseSection
            response={response}
            calculations={calculations}
            client={request?.client}
            onChangeResponse={setResponse}
          />
        </div>
      </div>
    </div>
  )
}