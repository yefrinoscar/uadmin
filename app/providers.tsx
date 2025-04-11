'use client'

// This is needed for React Query & tRPC to work in React Server Components
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import { createTRPCReact } from "@trpc/react-query"
import superjson from "superjson"
import type { AppRouter } from "@/server/api/root"

// Create React Query client
const queryClient = new QueryClient()

// Create tRPC client
export const api = createTRPCReact<AppRouter>()

const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      transformer: superjson,
    }),
  ],
})

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </api.Provider>
  )
}