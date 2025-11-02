import { Suspense } from "react";
import { CollectionsList } from "./_components/collections-list";
import { CollectionsSkeleton } from "./_components/collections-skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorMessage } from "@/components/ui/error-message";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export default function CollectionsPage() {
  prefetch(
    trpc.collections.getAll.queryOptions()
  );

  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <HydrateClient>
        <Suspense fallback={<CollectionsSkeleton />}>
          <CollectionsList />
        </Suspense>
      </HydrateClient>
    </ErrorBoundary>
  );
}
