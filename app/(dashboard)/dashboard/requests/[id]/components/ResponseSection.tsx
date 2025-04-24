"use client"

import { useState } from "react"
import { CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Client } from "@/trpc/api/routers/requests"
import { useTRPC } from '@/trpc/client'
import { useMutation } from '@tanstack/react-query'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ResponseSectionProps {
  response: string
  onChangeResponse: (v: string) => void
  client?: Client | null
  calculations: { totalUSD: number; totalPEN: number }
}

export function ResponseSection({
  response,
  client,
  calculations,
  onChangeResponse
}: ResponseSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const trpc = useTRPC();

  // Set up tRPC mutation for generating email text
  const generateEmailMutationOptions = trpc.requests.generateEmailText.mutationOptions({
    onSuccess: (data) => {
      onChangeResponse(data.email)
    },
    onError: () => {
      toast("Error", {
        description: "Error al generar el correo. Por favor, intente nuevamente o escriba su propia respuesta."
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    }
  });

  const generateEmailMutation = useMutation(generateEmailMutationOptions);

  const generateEmailText = async () => {
    const clientName = client?.name || "Cliente";
    setIsGenerating(true);

    try {
      await generateEmailMutation.mutateAsync({
        clientName,
        totalUSD: calculations.totalUSD,
        totalPEN: calculations.totalPEN
      });
    } catch {
      // Error handling is in the mutation options
    }
  };

  return (
    <div className="space-y-4">
        <CardTitle className="text-lg font-semibold">Respuesta al cliente</CardTitle>
      <div className="flex flex-col h-[calc(100%-8rem)]">
        <Textarea
          className="flex-grow min-h-[400px]"
          placeholder="Escribe la respuesta para el cliente..."
          value={response}
          disabled={isGenerating}
        />
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={generateEmailText}
              disabled={isGenerating}
              className="relative overflow-hidden group"
              style={{
                background: "linear-gradient(90deg, rgb(59, 130, 246), rgb(147, 51, 234))",
                color: "white",
                borderColor: "transparent",
              }}
            >
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="flex items-center gap-2 z-10">
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    <span>Generando con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generar con IA</span>
                  </>
                )}
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Genera una respuesta profesional utilizando IA</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}