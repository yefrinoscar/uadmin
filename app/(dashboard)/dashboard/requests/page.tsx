import { Suspense } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { RequestsTable } from "@/components/requests-table";
import { RequestsTableSkeleton } from "@/components/requests-table-skeleton";

export default function RequestsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 h-10 mb-16">
        <SidebarTrigger />
        <Separator orientation="vertical" className="!h-6" />
        <h1 className="font-light text-neutral-100 text-sm tracking-tight">Tabla de solicitudes de pedidos</h1>
      </div>

      <div className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold tracking-tight">Todos los pedidos</h2>
        <Suspense fallback={<RequestsTableSkeleton />}>
          <RequestsTable />
        </Suspense>
      </div>
    </div>
  );
}