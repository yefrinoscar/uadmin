import { RequestFilter } from "@/trpc/api/routers/requests";

export const INITIAL_FILTERS: RequestFilter = {
  status: null,
  text: null,
  clientId: null,
};