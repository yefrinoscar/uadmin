import { Suspense } from 'react';
import { RequestsTable } from "./_components/requests-table";
import { RequestsTableSkeleton } from "@/app/(dashboard)/dashboard/requests/_components/requests-table-skeleton";
import { RequestsFilters } from "./_components/RequestsFilters";
import { RequestsKPIs } from "./_components/requests-kpis";
import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { loadRequestFiltersParams } from './hooks/useRequestFilters';
import { SearchParams } from 'nuqs';

type Props = {
  searchParams: Promise<SearchParams>;
};

export default async function RequestsPage(params: Props) {
  const searchParams = await params.searchParams;

  const filters = loadRequestFiltersParams(searchParams)

  // Prefetch data on the server for initial page load
  prefetch(
    trpc.requests.getAll.queryOptions(
      {
        page: 1,
        pageSize: 10,
        filters
      }
    )
  );

  // Prefetch stats data
  prefetch(
    trpc.requests.getStats.queryOptions({ period: "current_month" })
  );

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Ventas y Pedidos</h1>
        <p className="text-muted-foreground">
          Análisis de ventas y gestión de pedidos de los clientes.
        </p>
      </div>

      <div className="space-y-4">
        <HydrateClient>
            <RequestsKPIs />

          <RequestsFilters />

          <Suspense fallback={<RequestsTableSkeleton />}>
            <RequestsTable />
          </Suspense>
        </HydrateClient>
      </div>

    </div>
  );
}