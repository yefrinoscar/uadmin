import { Suspense } from "react";
import { SalesTable } from "./_components/sales-table";
import { SalesTableSkeleton } from "./_components/sales-table-skeleton";
import { SalesCharts } from "./_components/sales-charts";
import { SalesChartsSkeleton } from "./_components/sales-charts-skeleton";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorMessage } from "@/components/ui/error-message";

export default function SalesPage() {
  
  prefetch(
    trpc.sales.getStats.queryOptions({ period: "current_month" })
  )
  
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <HydrateClient>
        <div className="space-y-6">
          <Suspense fallback={<SalesChartsSkeleton />}>
            <SalesCharts />
          </Suspense>
          
          <Suspense fallback={<SalesTableSkeleton />}>
            <SalesTable />
          </Suspense>
        </div>
      </HydrateClient>
    </ErrorBoundary>
  );
}
