import { Suspense } from "react";
import { RequestsTableSkeleton } from "@/app/(dashboard)/dashboard/requests/_components/requests-table-skeleton";
import { RequestsTable } from "./_components/requests-table";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default function RequestsPage() {

  prefetch(
    trpc.requests.getAll.queryOptions()
  )

  return (
    <>
      <div className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold tracking-tight">Todos los pedidos</h2>
        <HydrateClient>
          <Suspense fallback={<RequestsTableSkeleton />}>
            <RequestsTable />
          </Suspense>
        </HydrateClient>
      </div>
    </>
  );
}