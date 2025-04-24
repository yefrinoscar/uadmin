import { HydrateClient, prefetch, trpc } from "@/trpc/server"
import { RequestDetail } from './components/RequestDetail'
import { RequestSkeleton } from './components/RequestSkeleton'
import { Suspense } from 'react'

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const p = await params;

  prefetch(
    trpc.requests.getById.queryOptions({ id: p.id })
  )

  return (
    <>
      <HydrateClient>
        <Suspense fallback={<RequestSkeleton />}>
          <RequestDetail id={p.id} />
        </Suspense>
      </HydrateClient>
    </>
  )
}