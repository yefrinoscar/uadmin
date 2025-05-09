"use client"

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { PurchaseRequest, Product } from "@/trpc/api/routers/requests";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 'medium' }, 
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' }, 
  ],
});

const PRIMARY_TEXT_COLOR = '#171717'; 
const SECONDARY_TEXT_COLOR = '#525252'; 
const BORDER_COLOR_LIGHT = '#e5e5e5'; 
const BACKGROUND_HIGHLIGHT = '#f5f5f5'; 
const ACCENT_COLOR = '#4D2DDA'; 

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10, 
    paddingTop: 30,
    paddingBottom: 50, 
    paddingHorizontal: 30,
    backgroundColor: '#fff',
    color: PRIMARY_TEXT_COLOR,
  },
  headerSection: {
    marginBottom: 25,
    textAlign: 'center', 
  },
  mainTitle: {
    fontSize: 18, 
    fontWeight: 'bold',
    color: ACCENT_COLOR,
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 10,
    color: SECONDARY_TEXT_COLOR,
  },
  detailsSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: BACKGROUND_HIGHLIGHT,
    borderRadius: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6, 
  },
  detailLabel: {
    width: '35%', 
    fontSize: 10,
    fontWeight: 'medium', 
    color: PRIMARY_TEXT_COLOR,
    marginRight: 5,
  },
  detailValue: {
    width: '65%', 
    fontSize: 10,
    color: SECONDARY_TEXT_COLOR,
    flexShrink: 1, 
  },
  sectionSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR_LIGHT,
    marginVertical: 15, 
  },
  contentSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: ACCENT_COLOR,
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR_LIGHT,
  },
  table: {
    width: 'auto',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR_LIGHT,
    alignItems: 'center',
  },
  tableHeaderRow: {
    backgroundColor: BACKGROUND_HIGHLIGHT,
    borderBottomWidth: 1.5, 
    borderBottomColor: ACCENT_COLOR, 
  },
  tableColHeader: {
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
    color: ACCENT_COLOR, 
  },
  tableCol: {
    padding: 8, 
    fontSize: 9,
  },
  productTitleText: {
    fontWeight: 'medium',
    color: PRIMARY_TEXT_COLOR,
  },
  totalsSection: {
    marginTop: 10, 
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR_LIGHT,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingHorizontal: 5, 
  },
  totalsLabel: {
    fontSize: 10,
    color: SECONDARY_TEXT_COLOR,
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: 'medium',
    color: PRIMARY_TEXT_COLOR,
    textAlign: 'right',
  },
  grandTotalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: ACCENT_COLOR,
  },
  grandTotalLabel: {
    fontSize: 12, 
    fontWeight: 'bold',
    color: ACCENT_COLOR,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: ACCENT_COLOR,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: SECONDARY_TEXT_COLOR,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'medium',
    color: '#fff', 
    textAlign: 'center',
  }
});

interface RequestPDFProps {
  request: PurchaseRequest;
  products: Product[];
  calculations: {
    displayCurrency?: 'PEN' | 'USD';
    subtotalProductos?: number;
    shippingAndOtherCosts?: number;
    exchangeRate?: number;
    finalTotal?: number;
    currency?: string; 
    shipping?: number; 
    finalPriceToDisplay?: number;
  } | null;
}

export const RequestPDF = ({ request, products, calculations }: RequestPDFProps) => {
  const createdDate = request.created_at
    ? formatDistance(new Date(request.created_at), new Date(), { addSuffix: true, locale: es })
    : "-";

  const statusMap: Record<string, { label: string; color: string; backgroundColor: string }> = {
    pending: { label: 'Pendiente', color: '#663c00', backgroundColor: '#fff0c2' },
    approved: { label: 'Aprobado', color: '#1e4620', backgroundColor: '#d1f7c4' },
    rejected: { label: 'Rechazado', color: '#5a1d1d', backgroundColor: '#ffd5d5' },
    default: { label: String(request.status || "Desconocido"), color: '#333', backgroundColor: '#e0e0e0' },
  };
  const currentStatusKey = request.status || 'default';
  const currentStatus = statusMap[currentStatusKey] || statusMap.default;

  const resolvedDisplayCurrency = calculations?.displayCurrency || (calculations?.currency === 'PEN' ? 'PEN' : 'USD');
  const currencySymbol = resolvedDisplayCurrency === "PEN" ? "S/." : "$";
  
  const subtotalForPdf = calculations?.subtotalProductos ?? 
                         products.reduce((sum, p) => sum + p.price, 0);
  const shippingAndOthersForPdf = calculations?.shippingAndOtherCosts ?? 
                                  calculations?.shipping ?? 
                                  0;
  const exchangeRateForPdf = calculations?.exchangeRate;
  const finalTotalForPdf = calculations?.finalTotal ?? 
                           calculations?.finalPriceToDisplay ?? 
                           products.reduce((sum, p) => sum + p.price, 0) + (calculations?.shipping || 0);

  return (
    <Document title={`Pedido ${request.id}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Detalle del Pedido</Text>
          <Text style={styles.subTitle}>ID Pedido: #{request.id}</Text>
          <Text style={styles.subTitle}>Generado: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
        </View>

        <View style={styles.detailsSection}>
          <Text style={[styles.contentSectionTitle, { marginBottom: 12, borderBottomWidth: 0 }]}>Información General</Text>

          <Text style={{fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: ACCENT_COLOR }}>Cliente:</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nombre:</Text>
            <Text style={styles.detailValue}>{request.client?.name || "-"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{request.client?.email || "-"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Teléfono:</Text>
            <Text style={styles.detailValue}>{request.client?.phone_number || "-"}</Text>
          </View>

          <View style={styles.sectionSeparator} />

          <Text style={{fontSize: 11, fontWeight: 'bold', marginBottom: 6, color: ACCENT_COLOR }}>Pedido:</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Descripción:</Text>
            <Text style={styles.detailValue}>{request.description || "-"}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Creado:</Text>
            <Text style={styles.detailValue}>{createdDate}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Estado:</Text>
            <View style={[styles.detailValue, { width: 'auto'}]}>
                <Text style={[styles.statusBadge, {backgroundColor: currentStatus.backgroundColor, color: currentStatus.color}]}>
                    {currentStatus.label}
                </Text>
            </View>
          </View>
        </View>

        <Text style={styles.contentSectionTitle}>Productos</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <View style={[styles.tableColHeader, { width: '5%' }]}><Text>#</Text></View>
            <View style={[styles.tableColHeader, { width: '55%' }]}><Text>Descripción</Text></View> 
            <View style={[styles.tableColHeader, { width: '15%', textAlign: 'right' }]}><Text>Cant.</Text></View>
            <View style={[styles.tableColHeader, { width: '15%', textAlign: 'right' }]}><Text>P. Unit.</Text></View>
            <View style={[styles.tableColHeader, { width: '10%', textAlign: 'right' }]}><Text>Total</Text></View> 
          </View>
          {products.length > 0 ? products.map((product, index) => (
            <View style={styles.tableRow} key={product.id}>
              <View style={[styles.tableCol, { width: '5%' }]}><Text>{index + 1}</Text></View>
              <View style={[styles.tableCol, { width: '55%' }]}>
                <Text style={styles.productTitleText}>{product.title || "-"}</Text>
              </View>
              <View style={[styles.tableCol, { width: '15%', textAlign: 'right' }]}><Text>1</Text></View>
              <View style={[styles.tableCol, { width: '15%', textAlign: 'right' }]}><Text>{currencySymbol}{product.price.toFixed(2)}</Text></View>
              <View style={[styles.tableCol, { width: '10%', textAlign: 'right' }]}><Text>{currencySymbol}{product.price.toFixed(2)}</Text></View>
            </View>
          )) : (
            <View style={styles.tableRow}>
              <View style={[styles.tableCol, { width: '100%', textAlign: 'center' }]}>
                <Text style={{paddingVertical: 10, color: SECONDARY_TEXT_COLOR}}>No hay productos en este pedido.</Text>
              </View>
            </View>
          )}
        </View>

        {products.length > 0 && (
          <View style={styles.totalsSection}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal Productos:</Text>
              <Text style={styles.totalsValue}>{currencySymbol}{subtotalForPdf.toFixed(2)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Envío y Otros:</Text>
              <Text style={styles.totalsValue}>{currencySymbol}{shippingAndOthersForPdf.toFixed(2)}</Text>
            </View>
            {resolvedDisplayCurrency === "PEN" && exchangeRateForPdf && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tipo de Cambio (USD a PEN):</Text>
                <Text style={styles.totalsValue}>{exchangeRateForPdf.toFixed(3)}</Text>
              </View>
            )}
            <View style={[styles.totalsRow, styles.grandTotalRow]}>
              <Text style={[styles.totalsLabel, styles.grandTotalLabel]}>TOTAL ({resolvedDisplayCurrency}):</Text>
              <Text style={[styles.totalsValue, styles.grandTotalValue]}>{currencySymbol}{finalTotalForPdf.toFixed(2)}</Text>
            </View>
          </View>
        )}
        
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages} | Documento generado por UAdmin`
        )} fixed />
      </Page>
    </Document>
  );
}; 

export default RequestPDF;
