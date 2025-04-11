import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'
import type { AppRouter } from '@/server/api/root'

export const trpc = createTRPCNext<AppRouter>({
  transformer: superjson,
  config(opts) {
    return {
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    }
  },
  ssr: false,
}) 