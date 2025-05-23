import { Suspense } from "react";
import { PromotionsBoard } from "./_components/promotions-board";
import { PromotionsBoardSkeleton } from "./_components/promotions-board-skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorMessage } from "@/components/ui/error-message";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default function PromotionsPage() {

  prefetch(
    trpc.promotions.getAll.queryOptions({ ascending: true })
  )

  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <HydrateClient>
        <Suspense fallback={<PromotionsBoardSkeleton />}>
          <PromotionsBoard />
        </Suspense>
      </HydrateClient>
    </ErrorBoundary>

  );
}