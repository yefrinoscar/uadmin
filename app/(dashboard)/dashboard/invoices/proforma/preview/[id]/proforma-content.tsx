'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSupabaseClient } from '@/lib/supabase-client'
import { proformaService } from '@/lib/services/proforma'
import type { Proforma, ProformaData } from "@/types/proforma"
import ProformaPreview from '@/components/proforma-preview'
import { COMPANY_INFO } from '@/lib/constants/company-info'

export default function ProformaContent() {
  const params = useParams()  
  const { getAuthenticatedClient } = useSupabaseClient()
  const [proforma, setProforma] = useState<Proforma | null>(null)

  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const supabase = await getAuthenticatedClient()
        const data = await proformaService.getById(supabase, params.id as string)
        setProforma(data)
      } catch (err) {
        console.error('Error fetching proforma:', err)
      }
    }

    fetchProforma()
  }, [params.id, getAuthenticatedClient])

  if (!proforma) return null

  const proformaData: ProformaData = {
    id: proforma.id,
    companyInfo: COMPANY_INFO,
    proformaInfo: {
      number: proforma.proformaInfo.number,
      date: proforma.proformaInfo.date,
      seller: {
        name: proforma.seller?.name || '',
        phone: proforma.seller?.phone || '',
        email: proforma.seller?.email || '',
      }
    },
    clientInfo: {
      name: proforma.client?.name || '',
      address: proforma.client?.address || '',
      ruc: proforma.client?.ruc || '',
      contactPerson: proforma.client?.contactPerson || ''
    },
    conditions: {
      includeIGV: proforma.conditions.includeIGV,
      validityPeriodDays: proforma.conditions.validityPeriodDays,
      deliveryTime: proforma.conditions.deliveryTime,
      paymentMethod: proforma.conditions.paymentMethod
    },
    items: proforma.items || [],
    totalAmount: proforma.totalAmount
  }

  return <ProformaPreview proformaData={proformaData} />
}