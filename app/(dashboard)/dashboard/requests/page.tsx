import { Suspense } from 'react';
import { RequestsTable } from "./_components/requests-table";
import { RequestsTableSkeleton } from "@/app/(dashboard)/dashboard/requests/_components/requests-table-skeleton";
import { RequestsFilters } from "./_components/RequestsFilters";
import { HydrateClient, trpc, prefetch } from "@/trpc/server";

export default function RequestsPage() {
  // Prefetch data on the server for initial page load
  prefetch(
    trpc.requests.getAll.queryOptions({ page: 1, pageSize: 10, status: undefined }) // Use undefined for 'all' statuses
  );


  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">
          Administra y revisa los pedidos de los clientes.
        </p>
      </div>

      <div className="space-y-4">
        <RequestsFilters />

        <HydrateClient>
          <Suspense fallback={<RequestsTableSkeleton />}>
            <RequestsTable />
          </Suspense>
        </HydrateClient>
      </div>

    </div>
  );
}