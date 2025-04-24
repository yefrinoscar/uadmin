import { router } from '../init'
import { requestsRouter } from './routers/requests'
import { productsRouter } from './routers/products'
import { promotionsRouter } from './routers/promotions'
import { proformaRouter } from './routers/proforma'

export const appRouter = router({
  requests: requestsRouter,
  products: productsRouter,
  promotions: promotionsRouter,
  proforma: proformaRouter,
})

export type AppRouter = typeof appRouter