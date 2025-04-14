"use client"

import { Suspense } from "react";
import { PromotionsBoard } from "./_components/promotions-board";
import { PromotionsBoardSkeleton } from "./_components/promotions-board-skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorMessage } from "@/components/ui/error-message";

export default function PromotionsPage() {

  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<PromotionsBoardSkeleton />}>
        <PromotionsBoard />
      </Suspense>
    </ErrorBoundary>
  );
}