import { SalesTableSkeleton } from "./_components/sales-table-skeleton";
import { SalesChartsSkeleton } from "./_components/sales-charts-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <SalesChartsSkeleton />
      <SalesTableSkeleton />
    </div>
  );
}
