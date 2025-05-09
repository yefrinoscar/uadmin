import { router } from '../init'
import { requestsRouter } from './routers/requests'
import { productsRouter } from './routers/products'
import { promotionsRouter } from './routers/promotions'
import { proformaRouter } from './routers/proforma'
import { salesRouter } from './routers/sales'

export const appRouter = router({
  requests: requestsRouter,
  products: productsRouter,
  promotions: promotionsRouter,
  proforma: proformaRouter,
  sales: salesRouter,
})

export type AppRouter = typeof appRouter