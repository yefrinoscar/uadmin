"use client"

import { useState, useRef } from "react"
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Eye, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistance } from "date-fns"
import { es } from "date-fns/locale"
import { Label } from "@/components/ui/label"
import { PurchaseRequest, Product } from "@/trpc/api/routers/requests"
import { formatCurrency } from "@/lib/utils"
import { useRequestDetailStore } from "@/store/requestDetailStore"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { RequestPDF } from "./RequestPDF"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PurchaseRequestStatus, purchaseRequestStatusLabels } from '../../types';

interface RequestDetailDrawerProps {
  request: PurchaseRequest; 
  products: Product[];
}

export function RequestDetailDrawer({ request, products }: RequestDetailDrawerProps) {
  const [open, setOpen] = useState(false)
  const { calculations, exchangeRate: storeExchangeRate, finalPricePEN, totalGeneralUSD, finalPriceDisplayCurrency } = useRequestDetailStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [selectedCurrency] = useState<string>("USD");

  const getInitials = (title: string) => {
    return title
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // const getStatusInfo = () => {
  //   switch (request.status) { 
  //     case "pending": 
  //       return { 
  //         step: 1, 
  //         icon: <Clock className="h-5 w-5 text-amber-500" />,
  //         color: "bg-amber-500",
  //         label: purchaseRequestStatusLabels.pending
  //       };
  //     case "in_progress":
  //       return {
  //         step: 2, 
  //         icon: <Loader2 className="h-5 w-5 text-sky-500 animate-spin" />,
  //         color: "bg-sky-500",
  //         label: purchaseRequestStatusLabels.in_progress
  //       };
  //     case "in_transit":
  //       return {
  //         step: 3,
  //         icon: <Truck className="h-5 w-5 text-violet-500" />, 
  //         color: "bg-violet-500",
  //         label: purchaseRequestStatusLabels.in_transit
  //       };
  //     case "completed":
  //       return {
  //         step: 4,
  //         icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  //         color: "bg-green-500",
  //         label: purchaseRequestStatusLabels.completed
  //       };
  //     case "delivered":
  //       return {
  //         step: 5,
  //         icon: <CheckCircle2 className="h-5 w-5 text-teal-500" />, 
  //         color: "bg-teal-500",
  //         label: purchaseRequestStatusLabels.delivered
  //       };
  //     case "cancelled":
  //       return {
  //         step: 0, 
  //         icon: <XCircle className="h-5 w-5 text-red-500" />,
  //         color: "bg-red-500",
  //         label: purchaseRequestStatusLabels.cancelled
  //       };
  //     default: 
  //       return { 
  //         step: 1, 
  //         icon: <Clock className="h-5 w-5 text-slate-500" />,
  //         color: "bg-slate-500",
  //         label: request.status ? purchaseRequestStatusLabels[request.status as PurchaseRequestStatus] || request.status : "Desconocido"
  //       };
  //   }
  // }

  const displayAmount = (amountUSD: number) => {
    return selectedCurrency === "PEN" 
      ? formatCurrency(amountUSD * (storeExchangeRate || 3.7), "PEN") 
      : formatCurrency(amountUSD, "USD");
  };

  const renderStatusBadge = (status: PurchaseRequestStatus) => { 
    let bgColor, textColor, borderColor;
    const text = purchaseRequestStatusLabels[status] || status.toString(); 

    switch (status) {
      case 'pending':
        bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
        textColor = 'text-yellow-700 dark:text-yellow-400';
        borderColor = 'border-yellow-300 dark:border-yellow-700';
        break;
      case 'in_progress':
        bgColor = 'bg-blue-100 dark:bg-blue-900/30';
        textColor = 'text-blue-700 dark:text-blue-400';
        borderColor = 'border-blue-300 dark:border-blue-700';
        break;
      case 'in_transit':
        bgColor = 'bg-violet-100 dark:bg-violet-900/30';
        textColor = 'text-violet-700 dark:text-violet-400';
        borderColor = 'border-violet-300 dark:border-violet-700';
        break;
      case 'completed':
        bgColor = 'bg-green-100 dark:bg-green-900/30';
        textColor = 'text-green-700 dark:text-green-400';
        borderColor = 'border-green-300 dark:border-green-700';
        break;
      case 'cancelled':
        bgColor = 'bg-red-100 dark:bg-red-900/30';
        textColor = 'text-red-700 dark:text-red-400';
        borderColor = 'border-red-300 dark:border-red-700';
        break;
      case 'delivered': 
        bgColor = 'bg-teal-100 dark:bg-teal-900/30';
        textColor = 'text-teal-700 dark:text-teal-400';
        borderColor = 'border-teal-300 dark:border-teal-700';
        break;
      default:
        bgColor = 'bg-gray-100 dark:bg-gray-700';
        textColor = 'text-gray-600 dark:text-gray-300';
        borderColor = 'border-gray-300 dark:border-gray-500';
        break;
    }
    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center border ${bgColor} ${textColor} ${borderColor}`}
      >
        {text}
      </span>
    );
  }

  if (!request || !products || !calculations) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Eye className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-4xl p-0 flex flex-col">
        <ScrollArea className="flex-grow">
          <div ref={contentRef} className="px-6 py-4">
            <SheetHeader className="mb-6 text-left">
              <div className="flex justify-between items-start">
                <div>
                  <SheetTitle className="text-2xl font-semibold">Detalle del Pedido</SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    ID: {request.id}
                  </SheetDescription>
                </div>
                {request.status && renderStatusBadge(request.status)}
              </div>
            </SheetHeader>

            {/* Client Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Información del Pedido</h3>
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <Label className="text-muted-foreground text-right">ID de pedido:</Label>
                <span className="font-mono font-medium">#{request.id}</span>

                <Label className="text-muted-foreground text-right">Descripción:</Label>
                <p className="font-medium text-wrap">{request.description}</p>

                <Label className="text-muted-foreground text-right">Nombre del cliente:</Label>
                <span className="font-semibold">{request.client?.name || "-"}</span>

                <Label className="text-muted-foreground text-right">Email del cliente:</Label>
                <span className="font-semibold">{request.client?.email || "-"}</span>

                <Label className="text-muted-foreground text-right">Teléfono del cliente:</Label>
                <span className="font-semibold">{request.client?.phone_number || "-"}</span>

                <Label className="text-muted-foreground text-right">Creado:</Label>
                <span>{request.created_at ? formatDistance(new Date(request.created_at), new Date(), { addSuffix: true, locale: es }) : "-"}</span>
              </div>
            </div>

            {/* Product List */}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Productos ({products.length})</h3>
              {products.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground bg-secondary/20 rounded-lg">
                  No hay productos en este pedido.
                </div>
              ) : (
                <ScrollArea className="h-[250px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Avatar className="h-9 w-9">
                              {(product.image_url || product.imageData) ? (
                                <AvatarImage src={product.image_url || product.imageData!} alt={product.title} />
                              ) : null}
                              <AvatarFallback>{getInitials(product.title)}</AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{product.title}</div>
                            {product.source && <Badge variant="outline" className="text-xs capitalize">{product.source}</Badge>}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {displayAmount(product.price)} 
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>

            {/* Footer with totals */}
            <div className="bg-secondary/20 p-4 rounded-lg border mt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal Productos:</span>
                  <span className="font-mono font-medium">{displayAmount(totalGeneralUSD)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos de Envío y Otros:</span>
                  <span className="font-mono font-medium">{displayAmount(calculations?.shippingCostUSD || 0)}</span>
                </div>
                {selectedCurrency === "PEN" && (
                  <>
                    <Separator className="my-1" /> 
                    <div className="flex justify-between">
                      <span>Tipo de Cambio:</span>
                      <span className="font-mono font-medium">{(storeExchangeRate || 3.7).toFixed(3)}</span> 
                    </div>
                  </>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>TOTAL GENERAL:</span>
                  <span className="font-mono">{displayAmount(finalPriceDisplayCurrency === 'PEN' ? (finalPricePEN / (storeExchangeRate || 3.7)) : finalPricePEN)}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="px-6 py-4 border-t mt-auto">
          <div className="flex w-full gap-2">
            {(() => {
              const determinedDisplayCurrency: "PEN" | "USD" = 
                selectedCurrency === "PEN" ? "PEN" : "USD";

              const pdfCalculations: {
                displayCurrency: "PEN" | "USD";
                subtotalProductos: number;
                shippingAndOtherCosts: number;
                exchangeRate: number;
                finalTotal: number;
              } = {
                displayCurrency: determinedDisplayCurrency,
                subtotalProductos: determinedDisplayCurrency === 'USD' 
                  ? totalGeneralUSD 
                  : totalGeneralUSD * (storeExchangeRate || 3.7), 
                shippingAndOtherCosts: determinedDisplayCurrency === 'USD' 
                  ? (calculations?.shippingCostUSD || 0) 
                  : (calculations?.shippingCostUSD || 0) * (storeExchangeRate || 3.7), 
                exchangeRate: (storeExchangeRate || 3.7),
                finalTotal: determinedDisplayCurrency === 'USD' 
                  ? (finalPriceDisplayCurrency === 'PEN' ? (finalPricePEN / (storeExchangeRate || 3.7)) : finalPricePEN)
                  : finalPricePEN,
              };

              return (
                <PDFDownloadLink
                  document={<RequestPDF request={request} products={products} calculations={pdfCalculations} />}
                  fileName={`pedido-${request.id}.pdf`}
                >
                  {({ loading }) =>
                    loading ? (
                      <Button variant="outline" size="sm" className="w-full mt-2" disabled>
                        <Download className="mr-2 h-4 w-4" />
                        Generando PDF...
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PDF
                      </Button>
                    )
                  }
                </PDFDownloadLink>
              );
            })()} 
            <SheetClose asChild>
              <Button variant="outline" className="flex-1">Cerrar</Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
