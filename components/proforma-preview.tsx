"use client"

import { useRef } from "react"
import type { ProformaData } from "@/types/proforma"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Download } from "lucide-react"
import { COMPANY_INFO } from "@/lib/constants"
interface ProformaPreviewProps {
  proformaData: ProformaData
}

export default function ProformaPreview({ proformaData }: ProformaPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)

  // Completely redesigned exportToPdf function to properly position the footer
  const exportToPdf = async () => {
    if (!contentRef.current || !footerRef.current) return

    // Create PDF with A4 dimensions
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 10 // margin in mm

    // Capture main content
    const contentCanvas = await html2canvas(contentRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const contentImgData = contentCanvas.toDataURL("image/png")

    // Capture footer separately
    const footerCanvas = await html2canvas(footerRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const footerImgData = footerCanvas.toDataURL("image/png")

    // Calculate dimensions
    const contentWidth = pageWidth - 2 * margin
    const contentHeight = (contentCanvas.height * contentWidth) / contentCanvas.width

    const footerWidth = pageWidth - 2 * margin
    const footerHeight = (footerCanvas.height * footerWidth) / footerCanvas.width

    // Check if content fits on one page
    if (contentHeight + footerHeight + 3 * margin <= pageHeight) {
      // Content and footer fit on one page
      // Add content at the top
      pdf.addImage(contentImgData, "PNG", margin, margin, contentWidth, contentHeight)

      // Add footer at the bottom
      pdf.addImage(footerImgData, "PNG", margin, pageHeight - footerHeight - margin, footerWidth, footerHeight)
    } else {
      // Content needs multiple pages
      let remainingContentHeight = contentHeight
      let currentPosition = 0

      while (remainingContentHeight > 0) {
        // Available height for content on this page (leave space for footer on last page)
        const isLastPage = remainingContentHeight <= pageHeight - 2 * margin - footerHeight
        const availableHeight = isLastPage ? pageHeight - 3 * margin - footerHeight : pageHeight - 2 * margin

        // Add content portion
        pdf.addImage(
          contentImgData,
          "PNG",
          margin,
          margin,
          contentWidth,
          contentHeight,
          "",
          "FAST",
          currentPosition === 0 ? 0 : -currentPosition,
        )

        // Add footer on the last page
        if (isLastPage) {
          pdf.addImage(footerImgData, "PNG", margin, pageHeight - footerHeight - margin, footerWidth, footerHeight)
        }

        remainingContentHeight -= availableHeight
        currentPosition += availableHeight

        // Add new page if needed
        if (remainingContentHeight > 0) {
          pdf.addPage()
        }
      }
    }

    pdf.save(`proforma-${proformaData.proformaInfo.number}.pdf`)
  }

  console.log(proformaData)
  const { proformaInfo, clientInfo, conditions, items } = proformaData


  return (
    <div className="space-y-4">
      <Button onClick={exportToPdf} className="w-full sm:w-auto" variant="default">
        <Download className="mr-2 h-4 w-4" />
        Export to PDF
      </Button>

      <Card className="bg-white">
        <div className="p-6">
          {/* Main Content - Now in a separate div with its own ref */}
          <div ref={contentRef}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
              <div className="w-full md:w-2/3">
                <div className="flex items-start gap-4">
                  <Image src="/images/logo_text.png" alt="Company Logo" width={100} height={80} className="mb-2" />
                  <div className="text-sm">
                    <p className="font-bold">{COMPANY_INFO.name}</p>
                    <p>{COMPANY_INFO.address}</p>
                    <p>RUC: {COMPANY_INFO.ruc}</p>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/3 border-2 border-gray-800 p-4 text-center">
                <p className="font-bold text-lg">PROFORMA # {proformaInfo.number}</p>
                <p className="mt-2">Fecha: {proformaInfo.date}</p>
              </div>
            </div>

            {/* Client Info */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">DATOS DEL CLIENTE.-</h3>
                <div className="grid grid-cols-1 gap-2">
                  <p>
                    <span className="font-bold">Nombre o Razon Social:</span> {clientInfo.name}
                  </p>
                  <p>
                    <span className="font-bold">Domicilio:</span> {clientInfo.address}
                  </p>
                  <p>
                    <span className="font-bold">RUC:</span> {clientInfo.ruc}
                  </p>
                  <p>
                    <span className="font-bold">Atencion Sr(a)(ta):</span> {clientInfo.contactPerson}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Conditions */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">CONDICIONES GENERALES -</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p>
                    <span className="font-bold">Precios:</span> {conditions.includeIGV ? 'Incluye IGV' : 'Excluye IGV'}
                  </p>
                  <p>
                    <span className="font-bold">Validez de la Oferta:</span> {conditions.validityPeriodDays} días
                  </p>
                  <p>
                    <span className="font-bold">Plazo de Entrega:</span> {conditions.deliveryTime}
                  </p>
                  <p>
                    <span className="font-bold">Forma de Pago:</span> {conditions.paymentMethod}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Introduction Text - Moved after conditions */}
            <div className="mb-6 text-sm">
              <p className="text-center mb-4">
                Estimados Señores. Por medio de la presente, y de acuerdo a su solicitud, sometemos a su consideracion
                nuestra oferta como sigue:
              </p>
            </div>

            {/* Items Table */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-medium">IT</TableHead>
                      <TableHead className="font-medium">Codigo</TableHead>
                      <TableHead className="font-medium">Nombre o Descripcion</TableHead>
                      <TableHead className="font-medium">Uni</TableHead>
                      <TableHead className="font-medium">Cantidad</TableHead>
                      <TableHead className="font-medium text-right">Precio Unit.</TableHead>
                      <TableHead className="font-medium text-right">Precio Total</TableHead>
                      <TableHead className="font-medium">Garantia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>
                          {item.description}
                          {item.notes && (
                            <p className="text-xs mt-1 text-gray-600">{item.notes}</p>
                          )}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{item.quantity.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{item.unit_price.toFixed(3)}</TableCell>
                        <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                        <TableCell>{item.warranty_months}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Total */}
            <div className="flex justify-end mb-10">
              <div className="w-1/3 border p-2">
                <div className="flex justify-between font-bold">
                  <span>TOTAL S/.</span>
                  <span>{proformaData.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Improved closing text */}
            <div className="mt-10 mb-6">
              <p className="text-sm">
                Agradecemos su interés en nuestros productos y servicios. Estamos seguros de que nuestra oferta cumplirá
                con sus expectativas de calidad y rendimiento. Quedamos a su disposición para resolver cualquier duda o
                consulta adicional que pueda surgir.
              </p>
            </div>

            {/* Signature Space - Increased space */}
            <div className="mt-24 grid grid-cols-2 gap-4">
              <div></div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2 mx-auto w-48">
                  <p className="font-bold">{proformaInfo.seller.name}</p>
                  <p>Ejecutiva de Ventas</p>
                </div>
              </div>
            </div>

            {/* Contact info - Before footer with space */}
            <div className="mt-8 text-center">
              <p>
                Cualquier Consulta: {proformaInfo.seller.phone} | email: {proformaInfo.seller.email}
              </p>
            </div>
          </div>

          {/* Footer - In a separate div with its own ref */}
          <div ref={footerRef} className="mt-16 text-xs text-gray-600">
            <div className="flex justify-between">
              <p>Pagina.- 1</p>
              <p>UNDERLA S.A.C. ®</p>
              <p>{proformaInfo.date} 05:15:35 PM</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

