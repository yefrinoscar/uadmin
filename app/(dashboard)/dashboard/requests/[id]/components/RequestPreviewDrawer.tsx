"use client";

import React, { useRef, useState } from "react";
import { Copy, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useRequestDetailStore } from "@/store/requestDetailStore";
import { PurchaseRequestStatus, purchaseRequestStatusLabels } from "../../types";
import Image from "next/image";
import html2canvas from "html2canvas";
import generatePdf from 'react-to-pdf';

type CurrencyDisplay = 'USD' | 'PEN' | 'BOTH';

export function RequestPreviewDrawer() {
  const { request, getCalculatedPricing } = useRequestDetailStore();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [currencyDisplay, setCurrencyDisplay] = useState<CurrencyDisplay>('BOTH');
  
  // Determine if it's a quote or an order based on status
  const products = request?.products ?? [];
  const isPending = request?.status === "pending";
  const documentType = isPending ? "Cotización" : "Pedido";
  
  // Obtener todos los cálculos del store (igual que TotalSummaryCard)
  const pricing = getCalculatedPricing();
  
  const {
    subTotal,
    totalShippingCost,
    totalProfitUSD,
    finalPriceUSD,
    exchangeRate
  } = pricing;
  
  // Conversiones a PEN
  const subtotalPEN = subTotal * exchangeRate;
  const shippingCostsPEN = totalShippingCost * exchangeRate;
  const totalProfitPEN = totalProfitUSD * exchangeRate;
  const finalPricePEN = finalPriceUSD * exchangeRate;

  const formattedDate = request?.created_at 
    ? new Date(request.created_at).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : '';

  // Helper function to format price based on currency display setting
  const formatPrice = (usdValue: number, penValue: number) => {
    if (currencyDisplay === 'USD') {
      return formatCurrency(usdValue);
    } else if (currencyDisplay === 'PEN') {
      return `S/. ${formatCurrency(penValue, "PEN")}`;
    } else {
      return `${formatCurrency(usdValue)} (S/. ${formatCurrency(penValue, "PEN")})`;
    }
  };

  // Utility function to prepare the clone for export - avoiding oklch colors
  const prepareElementForExport = () => {
    if (!contentRef.current) return null;
    
    // Clone the node to avoid modifying the actual DOM
    const clone = contentRef.current.cloneNode(true) as HTMLElement;
    
    // Create a style element to inject safe colors
    const style = document.createElement('style');
    style.textContent = `
      /* Default text color preserving hierarchy */
      #request-preview-content {
        background-color: #FFFFFF !important;
        color: #000000 !important;
      }
      
      /* Reset universal properties that might use oklch */
      #request-preview-content * {
        --tw-text-opacity: 1 !important;
        --tw-bg-opacity: 1 !important;
        --tw-border-opacity: 1 !important;
      }
      
      /* Status badge background-colors */
      .bg-yellow-100 { background-color: #FEF9C3 !important; }
      .bg-blue-100 { background-color: #DBEAFE !important; }
      .bg-indigo-100 { background-color: #E0E7FF !important; }
      .bg-green-100 { background-color: #DCFCE7 !important; }
      .bg-emerald-100 { background-color: #D1FAE5 !important; }
      .bg-red-100 { background-color: #FEE2E2 !important; }
      
      /* Status badge text colors */
      .text-yellow-800 { color: #854D0E !important; }
      .text-blue-800 { color: #1E40AF !important; }
      .text-indigo-800 { color: #3730A3 !important; }
      .text-green-800 { color: #166534 !important; }
      .text-emerald-800 { color: #065F46 !important; }
      .text-red-800 { color: #991B1B !important; }
      
      /* Gray scale text colors */
      .text-gray-800 { color: #1F2937 !important; }
      .text-gray-700 { color: #374151 !important; }
      .text-gray-600 { color: #4B5563 !important; }
      .text-gray-500 { color: #6B7280 !important; }
      
      /* Backgrounds */
      .bg-gray-50 { background-color: #F9FAFB !important; }
      .bg-blue-50 { background-color: #EFF6FF !important; }
      
      /* Border colors */
      .border-yellow-200 { border-color: #FEF08A !important; }
      .border-blue-200 { border-color: #BFDBFE !important; }
      .border-indigo-200 { border-color: #C7D2FE !important; }
      .border-green-200 { border-color: #BBF7D0 !important; }
      .border-emerald-200 { border-color: #A7F3D0 !important; }
      .border-red-200 { border-color: #FECACA !important; }
      .border-gray-200 { border-color: #E5E7EB !important; }
      
      /* Default border */
      .border { border-color: #E5E7EB !important; }
      
      /* Specific selectors for structures in the component */
      #request-preview-content .rounded-lg.shadow-sm {
        background-color: #FFFFFF !important;
      }
      
      #request-preview-content .rounded-lg.border {
        border-color: #E5E7EB !important;
      }
      
      #request-preview-content .bg-gray-50.p-4.rounded-lg {
        background-color: #F9FAFB !important;
      }
      
      #request-preview-content table tr.bg-gray-50 {
        background-color: #F9FAFB !important;
      }
      
      #request-preview-content .border.rounded-lg.border-gray-200.bg-gray-50 {
        background-color: #F9FAFB !important;
        border-color: #E5E7EB !important;
      }
      
      /* Additional blue UI accent colors used in buttons */
      .border-blue-500\\/30 { border-color: rgba(59, 130, 246, 0.3) !important; }
      .text-blue-600 { color: #2563EB !important; }
      .text-blue-700 { color: #1D4ED8 !important; }
      .dark\\:text-blue-400 { color: #60A5FA !important; }
      
      /* Fix hover states to have consistent colors in export */
      .hover\\:text-blue-700:hover { color: #1D4ED8 !important; }
      .hover\\:bg-blue-50:hover { background-color: #EFF6FF !important; } 
      .dark\\:hover\\:bg-blue-950\\/50:hover { background-color: rgba(23, 37, 84, 0.5) !important; }
    `;
    
    // Add the style to the cloned element
    clone.insertBefore(style, clone.firstChild);
    
    // Find all elements with inline styles and remove any oklch colors
    const allElements = clone.querySelectorAll('*');
    allElements.forEach(el => {
      if (el instanceof HTMLElement) {
        // If there's an inline style with oklch
        if (el.style.cssText && el.style.cssText.includes('oklch')) {
          const computedStyle = getComputedStyle(el);
          
          // Try to replace with computed RGB values when possible
          for (let i = 0; i < el.style.length; i++) {
            const propName = el.style[i];
            const propValue = el.style.getPropertyValue(propName);
            
            if (propValue.includes('oklch')) {
              // Use computed style's RGB value if possible
              const computedValue = computedStyle.getPropertyValue(propName);
              if (computedValue && !computedValue.includes('oklch')) {
                el.style.setProperty(propName, computedValue, 'important');
              } else {
                // Fallback to an appropriate color based on property
                if (propName.includes('background') || propName === 'background') {
                  el.style.setProperty(propName, '#FFFFFF', 'important');
                } else if (propName.includes('color') || propName === 'color') {
                  el.style.setProperty(propName, '#000000', 'important');
                } else if (propName.includes('border') || propName === 'border') {
                  el.style.setProperty(propName, '#E5E7EB', 'important');
                }
              }
            }
          }
        }
      }
    });
    
    // Handle SVG elements separately
    const svgElements = clone.querySelectorAll('svg *');
    svgElements.forEach(el => {
      if (el instanceof SVGElement) {
        ['fill', 'stroke'].forEach(attr => {
          const value = el.getAttribute(attr);
          if (value && value.includes('oklch')) {
            // For SVG - try to get computed style
            const computedStyle = getComputedStyle(el);
            const computedValue = attr === 'fill' ? computedStyle.fill : computedStyle.stroke;
            if (computedValue && !computedValue.includes('oklch')) {
              el.setAttribute(attr, computedValue);
            } else {
              el.setAttribute(attr, attr === 'fill' ? '#000000' : 'none');
            }
          }
        });
      }
    });
    
    // Fix header with status badge centralization
    try {
      // Find the header section with company name and document info
      const headerSection = clone.querySelector('.flex.justify-between.items-start');
      if (headerSection) {
        // Find the right side info container
        const rightInfo = headerSection.querySelector('.text-right');
        if (rightInfo) {
          // Get the document title, date, and status badge
          const title = rightInfo.querySelector('h2')?.textContent || '';
          const date = rightInfo.querySelector('p')?.textContent || '';
          const statusBadge = rightInfo.querySelector('.rounded-full');
          
          // Create new right side container with flexbox
          const newRightInfo = document.createElement('div');
          newRightInfo.style.display = 'flex';
          newRightInfo.style.flexDirection = 'column';
          newRightInfo.style.alignItems = 'flex-end';
          newRightInfo.style.textAlign = 'right';
          
          // Add title
          const titleEl = document.createElement('h2');
          titleEl.textContent = title;
          titleEl.style.fontSize = '1.125rem';
          titleEl.style.fontWeight = '600';
          titleEl.style.color = '#374151';
          titleEl.style.margin = '0';
          newRightInfo.appendChild(titleEl);
          
          // Add date
          const dateEl = document.createElement('p');
          dateEl.textContent = date;
          dateEl.style.fontSize = '0.875rem';
          dateEl.style.color = '#6B7280';
          dateEl.style.margin = '0';
          newRightInfo.appendChild(dateEl);
          
          // Add status badge container
          const badgeContainer = document.createElement('div');
          badgeContainer.style.marginTop = '0.5rem';
          badgeContainer.style.display = 'flex';
          badgeContainer.style.justifyContent = 'center';
          
          // If we have a status badge, create a simplified version
          if (statusBadge) {
            const statusText = statusBadge.textContent || '';
            
            // Determine status color
            let bgColor = '#FEF9C3';
            let textColor = '#854D0E';
            let borderColor = '#FEF08A';
            
            if (statusBadge.classList.contains('bg-yellow-100')) {
              bgColor = '#FEF9C3';
              textColor = '#854D0E';
              borderColor = '#FEF08A';
            } else if (statusBadge.classList.contains('bg-blue-100')) {
              bgColor = '#DBEAFE';
              textColor = '#1E40AF';
              borderColor = '#BFDBFE';
            } else if (statusBadge.classList.contains('bg-indigo-100')) {
              bgColor = '#E0E7FF';
              textColor = '#3730A3';
              borderColor = '#C7D2FE';
            } else if (statusBadge.classList.contains('bg-green-100')) {
              bgColor = '#DCFCE7';
              textColor = '#166534';
              borderColor = '#BBF7D0';
            } else if (statusBadge.classList.contains('bg-emerald-100')) {
              bgColor = '#D1FAE5';
              textColor = '#065F46';
              borderColor = '#A7F3D0';
            } else if (statusBadge.classList.contains('bg-red-100')) {
              bgColor = '#FEE2E2';
              textColor = '#991B1B';
              borderColor = '#FECACA';
            }
            
            // Create new badge
            const newBadge = document.createElement('span');
            newBadge.textContent = statusText;
            newBadge.style.display = 'inline-block';
            newBadge.style.padding = '0.25rem 0.625rem';
            newBadge.style.borderRadius = '9999px';
            newBadge.style.fontSize = '0.75rem';
            newBadge.style.fontWeight = '500';
            newBadge.style.backgroundColor = bgColor;
            newBadge.style.color = textColor;
            newBadge.style.border = `1px solid ${borderColor}`;
            newBadge.style.textAlign = 'center';
            
            badgeContainer.appendChild(newBadge);
          }
          
          newRightInfo.appendChild(badgeContainer);
          
          // Replace the original right info with our new container
          headerSection.replaceChild(newRightInfo, rightInfo);
        }
      }
    } catch (error) {
      console.error("Error fixing header alignment:", error);
    }
    
    return clone;
  };
  
  // Generate a downloadable PDF with react-to-pdf
  const handleDownloadPDF = async () => {
    if (!contentRef.current || isExporting) {
      if (isExporting) toast.info("Exportación en progreso...");
      else toast.error("No se pudo obtener el contenido para generar el PDF.");
      return;
    }
    
    setIsExporting(true);
    const toastId = toast.loading("Generando PDF, por favor espera...");

    try {
      // Create a temporary div to hold our prepared element
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      
      const preparedElement = prepareElementForExport();
      if (!preparedElement) {
        throw new Error("Failed to prepare element for export");
      }
      
      // Fix status badge display - specifically target this element
      const statusBadges = preparedElement.querySelectorAll('.rounded-full');
      statusBadges.forEach(badge => {
        if (badge instanceof HTMLElement) {
          // Extract the text content
          const statusText = badge.textContent || '';
          
          // Replace the badge with a simpler version that will render correctly
          const newBadge = document.createElement('span');
          newBadge.textContent = statusText;
          newBadge.style.display = 'inline-block';
          newBadge.style.padding = '2px 8px';
          newBadge.style.borderRadius = '9999px';
          newBadge.style.fontSize = '12px';
          newBadge.style.fontWeight = '500';
          newBadge.style.textAlign = 'center';
          newBadge.style.margin = '0 auto';
          
          // Set background and text color based on the original status class
          if (badge.classList.contains('bg-yellow-100')) {
            newBadge.style.backgroundColor = '#FEF9C3';
            newBadge.style.color = '#854D0E';
            newBadge.style.border = '1px solid #FEF08A';
          } else if (badge.classList.contains('bg-blue-100')) {
            newBadge.style.backgroundColor = '#DBEAFE';
            newBadge.style.color = '#1E40AF';
            newBadge.style.border = '1px solid #BFDBFE';
          } else if (badge.classList.contains('bg-indigo-100')) {
            newBadge.style.backgroundColor = '#E0E7FF';
            newBadge.style.color = '#3730A3';
            newBadge.style.border = '1px solid #C7D2FE';
          } else if (badge.classList.contains('bg-green-100')) {
            newBadge.style.backgroundColor = '#DCFCE7';
            newBadge.style.color = '#166534';
            newBadge.style.border = '1px solid #BBF7D0';
          } else if (badge.classList.contains('bg-emerald-100')) {
            newBadge.style.backgroundColor = '#D1FAE5';
            newBadge.style.color = '#065F46';
            newBadge.style.border = '1px solid #A7F3D0';
          } else if (badge.classList.contains('bg-red-100')) {
            newBadge.style.backgroundColor = '#FEE2E2';
            newBadge.style.color = '#991B1B';
            newBadge.style.border = '1px solid #FECACA';
          }
          
          // Replace the original badge with our simplified version
          badge.parentNode?.replaceChild(newBadge, badge);
        }
      });
      
      container.appendChild(preparedElement);
      document.body.appendChild(container);
      
      try {
        // Generate the PDF from the prepared element
        await generatePdf(() => preparedElement, {
          filename: `${isPending ? 'Cotizacion' : 'Pedido'}_${request?.id?.slice(-6) || 'UNDERLA'}.pdf`,
        });
        
        toast.success("PDF guardado correctamente.", { id: toastId });
      } finally {
        // Clean up
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF. Inténtalo de nuevo.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Export to image using html2canvas
  const handleExportToImage = async () => {
    if (!contentRef.current || isExporting) {
      if (isExporting) toast.info("Exportación en progreso...");
      else toast.error("No se pudo obtener el contenido para generar la imagen.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Generando imagen, por favor espera...");

    try {
      // Create a temporary div to hold our prepared element
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      
      const preparedElement = prepareElementForExport();
      if (!preparedElement) {
        throw new Error("Failed to prepare element for export");
      }
      
      // Fix status badge display - specifically target this element
      const statusBadges = preparedElement.querySelectorAll('.rounded-full');
      statusBadges.forEach(badge => {
        if (badge instanceof HTMLElement) {
          // Extract the text content
          const statusText = badge.textContent || '';
          
          // Replace the badge with a simpler version that will render correctly
          const newBadge = document.createElement('div');
          newBadge.textContent = statusText;
          newBadge.style.display = 'inline-block';
          newBadge.style.padding = '2px 8px';
          newBadge.style.borderRadius = '9999px';
          newBadge.style.fontSize = '12px';
          newBadge.style.fontWeight = '500';
          newBadge.style.textAlign = 'center';
          newBadge.style.margin = '0 auto';
          
          // Set background and text color based on the original status class
          if (badge.classList.contains('bg-yellow-100')) {
            newBadge.style.backgroundColor = '#FEF9C3';
            newBadge.style.color = '#854D0E';
            newBadge.style.border = '1px solid #FEF08A';
          } else if (badge.classList.contains('bg-blue-100')) {
            newBadge.style.backgroundColor = '#DBEAFE';
            newBadge.style.color = '#1E40AF';
            newBadge.style.border = '1px solid #BFDBFE';
          } else if (badge.classList.contains('bg-indigo-100')) {
            newBadge.style.backgroundColor = '#E0E7FF';
            newBadge.style.color = '#3730A3';
            newBadge.style.border = '1px solid #C7D2FE';
          } else if (badge.classList.contains('bg-green-100')) {
            newBadge.style.backgroundColor = '#DCFCE7';
            newBadge.style.color = '#166534';
            newBadge.style.border = '1px solid #BBF7D0';
          } else if (badge.classList.contains('bg-emerald-100')) {
            newBadge.style.backgroundColor = '#D1FAE5';
            newBadge.style.color = '#065F46';
            newBadge.style.border = '1px solid #A7F3D0';
          } else if (badge.classList.contains('bg-red-100')) {
            newBadge.style.backgroundColor = '#FEE2E2';
            newBadge.style.color = '#991B1B';
            newBadge.style.border = '1px solid #FECACA';
          }
          
          // Replace the original badge with our simplified version
          badge.parentNode?.replaceChild(newBadge, badge);
        }
      });
      
      container.appendChild(preparedElement);
      document.body.appendChild(container);
      
      try {
        // Use html2canvas on the prepared element
        const canvas = await html2canvas(preparedElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        
        // Copy to clipboard instead of downloading
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              // Create a ClipboardItem and copy to clipboard
              const item = new ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([item]);
              toast.success("Imagen copiada al portapapeles.", { id: toastId });
            } catch (clipError) {
              console.error("Error copying to clipboard:", clipError);
              toast.error("Error al copiar la imagen. Tu navegador puede no soportar esta función.", { id: toastId });
            }
          } else {
            toast.error("Error al generar la imagen para copiar.", { id: toastId });
          }
        }, 'image/png');
        
      } finally {
        // Clean up
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Error al generar la imagen. Inténtalo de nuevo.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusDisplay = (status: PurchaseRequestStatus | undefined) => {
    if (!status) return "";

    const statusColors: Record<PurchaseRequestStatus, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 border-blue-200",
      in_transit: "bg-indigo-100 text-indigo-800 border-indigo-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {purchaseRequestStatusLabels[status]}
      </span>
    );
  };

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline" className="transition-all">
          <Eye className="h-4 w-4 mr-2" />
          Vista Previa
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-full min-w-[650px] max-w-[90%] sm:max-w-[700px]">
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-xl font-bold">Vista Previa de {documentType}</DrawerTitle>
                <DrawerDescription>
                  Visualización lista para ser exportada y compartida con el cliente
                </DrawerDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={currencyDisplay === 'USD' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrencyDisplay('USD')}
                >
                  USD
                </Button>
                <Button
                  variant={currencyDisplay === 'PEN' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrencyDisplay('PEN')}
                >
                  PEN
                </Button>
                <Button
                  variant={currencyDisplay === 'BOTH' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrencyDisplay('BOTH')}
                >
                  Ambos
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="p-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div 
              id="request-preview-content" 
              ref={contentRef}
              className="bg-white rounded-lg shadow-sm p-6 space-y-6"
            >
              {/* Header with company logo/name and invoice info */}
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-3">
                    <Image
                      className='w-9'
                      alt="Logo"
                      src="/underla_logo.svg"
                      width={200}
                      height={200}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Underla</h1>
                    <p className="text-gray-500 text-sm">Importaciones y Ventas</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <h2 className="text-lg font-semibold text-gray-700">{documentType} #{request?.id?.slice(-6)}</h2>
                  <p className="text-gray-500 text-sm">{formattedDate}</p>
                </div>
              </div>
              
              <Separator />
              
              {/* Client information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                  <p className="font-medium">{request?.client?.name || 'Cliente'}</p>
                  <p className="text-sm text-gray-600">{request?.client?.email || ''}</p>
                  <p className="text-sm text-gray-600">{request?.client?.phone_number || ''}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-medium text-gray-500">Detalle</h3>
                  <p className="text-sm text-gray-600">Tipo de cambio: <span className="font-medium">S/. {exchangeRate.toFixed(2)}</span></p>
                </div>
              </div>
              
              {/* Products table */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Productos</h3>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-800">
                        <TableHead className="w-[50%] font-medium">Producto</TableHead>
                        <TableHead className="font-medium">Cantidad</TableHead>
                        <TableHead className="text-right font-medium">Precio Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.title}</TableCell>
                          <TableCell>1</TableCell>
                          <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatPrice(subTotal, subtotalPEN)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos de envío y gestión:</span>
                  <span>{formatPrice(totalShippingCost + totalProfitUSD, shippingCostsPEN + totalProfitPEN)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Precio Final:</span>
                  <span>{formatPrice(finalPriceUSD, finalPricePEN)}</span>
                </div>
              </div>
              
              {/* Notes/terms */}
              <div className="text-sm text-gray-600 p-4 border rounded-lg border-gray-200 bg-gray-50">
                <p className="font-medium text-gray-700 mb-2">Notas:</p>
                {isPending && (
                  <p>• Esta cotización es válida por 7 días desde la fecha de emisión.</p>
                )}
                <p>• Los precios pueden estar sujetos a cambios según disponibilidad.</p>
                <p>• Método de pago: Transferencia bancaria</p>
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t pt-6">
            <div className="flex space-x-3">
              <Button onClick={handleExportToImage} className="flex-1 gap-2" disabled={isExporting}>
                <Copy className="h-4 w-4" />
                {isExporting ? "Exportando..." : "Copiar Imagen"}
              </Button>
              <Button onClick={handleDownloadPDF} variant="outline" className="flex-1 gap-2" disabled={isExporting}>
                <Download className="h-4 w-4" />
                {isExporting ? "Descargando..." : "Descargar PDF"}
              </Button>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost">Cerrar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
} 