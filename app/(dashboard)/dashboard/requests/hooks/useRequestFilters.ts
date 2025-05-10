import { useQueryStates } from "nuqs"; 
import {
  createLoader,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const requestFiltersSchema = {
  text: parseAsString,
  clientId: parseAsString,
  status: parseAsStringLiteral(["pending", "in_progress", "in_transit", "completed", "cancelled", "delivered"] as const),
};

export function useRequestFilters() {
  const [filters, setFilters] = useQueryStates(requestFiltersSchema);

  const resetFilters = () => {
    setFilters({
      text: null,
      clientId: null,
      status: null,
    });
  };

  const hasFilters = Object.values(filters).some(
    (value) => value !== null
  );

  return {
    filters,
    setFilters,
    resetFilters,
    hasFilters,
  };
}

export const loadRequestFiltersParams = createLoader(requestFiltersSchema);