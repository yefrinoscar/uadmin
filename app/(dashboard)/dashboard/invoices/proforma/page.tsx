import { ProformaList } from '@/components/proforma-list'
import WrapMainContent from '@/components/wrap-main-content'

export default function ProformaPage() {
  return (
    <WrapMainContent title="Proformas" subtitle="Lista de proformas">
      <ProformaList />
    </WrapMainContent>
  )
}
