import WrapContent from '@/components/wrap-main-content'
import { ProformaForm } from '../_components/proforma-form'

export const metadata = {
  title: 'Nueva Proforma',
  description: 'Crear una nueva proforma',
}

export default function NewProformaPage() {
  return (
    <WrapContent title="Nueva Proforma" subtitle="Crear una nueva proforma">
      <ProformaForm />
    </WrapContent>
  )
}
