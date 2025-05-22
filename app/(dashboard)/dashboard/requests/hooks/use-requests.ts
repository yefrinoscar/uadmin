import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export function useRequestQuery(id: string) {
    const trpc = useTRPC();
    return useSuspenseQuery(trpc.requests.getById.queryOptions({ id: id }));
  }
  