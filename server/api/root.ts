import { router } from '../trpc'
import { proformaRouter } from './routers/proforma'

export const appRouter = router({
  proforma: proformaRouter,
})

export type AppRouter = typeof appRouter 