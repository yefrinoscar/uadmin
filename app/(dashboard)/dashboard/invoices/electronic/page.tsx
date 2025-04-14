import { Suspense } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { PromotionsBoard } from "@/app/(dashboard)/dashboard/promotions/_components/promotions-board";
import { PromotionsBoardSkeleton } from "@/components/skeletons/promotions-board-skeleton";

export default function PromotionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 h-10 mb-16">
        <SidebarTrigger />
        <Separator orientation="vertical" className="!h-6" />
        <h1 className="text-xl font-semibold">Promociones</h1>
      </div>

      <div className="flex flex-col gap-5">
        <h2 className="text-2xl font-bold tracking-tight">Gestión de Promociones</h2>
        <Suspense fallback={<PromotionsBoardSkeleton />}>
          <PromotionsBoard />
        </Suspense>
      </div>
    </div>
  );
}
