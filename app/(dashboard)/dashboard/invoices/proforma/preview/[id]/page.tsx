'use client'

import { Suspense } from 'react'
import { ProformaSkeleton } from '@/components/skeletons'
import WrapMainContent from '@/components/wrap-main-content'
import ProformaContent from './proforma-content'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorMessage } from '@/components/ui/error-message'

export default function ProformaPreviewPage() {
  return (
    <WrapMainContent title="Proforma" subtitle="Preview proforma">
      <ErrorBoundary fallback={<ErrorMessage />}>
        <Suspense fallback={<ProformaSkeleton />}>
          <ProformaContent />
        </Suspense>
      </ErrorBoundary>
    </WrapMainContent>
  )
}
