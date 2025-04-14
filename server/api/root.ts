import { router } from '../trpc'
import { proformaRouter } from './routers/proforma'
import { promotionsRouter } from './routers/promotions'

export const appRouter = router({
  proforma: proformaRouter,
  promotions: promotionsRouter,
})

export type AppRouter = typeof appRouter 