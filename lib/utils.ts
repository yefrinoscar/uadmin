import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: "USD" | "PEN" = "USD") {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Intl.NumberFormat for PEN uses 'PEN' symbol, we want 'S/.'
  if (currency === "PEN") {
    return "S/. " + formatter.format(amount).replace(/PEN/g, '').trim();
  }
  return formatter.format(amount);
}

export function generateAttractivePrices(
  basePrice: number,
  currency: "PEN" | "USD"
): { value: number; label: string }[] {
  if (basePrice <= 0) return [];

  const suggestionsSet = new Set<number>();

  // Suggestion 1: Round down to nearest X.99 or X.90
  if (basePrice > 1) {
    const floorPrice = Math.floor(basePrice);
    suggestionsSet.add(parseFloat((floorPrice - 0.01).toFixed(2))); // Ends in .99
    if (floorPrice - 0.10 > 0) {
      suggestionsSet.add(parseFloat((floorPrice - 0.10).toFixed(2))); // Ends in .90
    }
  }
  // Suggestion 2: Round to nearest integer
  suggestionsSet.add(Math.round(basePrice));
  // Suggestion 3: Round up to nearest integer or X.50
  suggestionsSet.add(Math.ceil(basePrice));
  suggestionsSet.add(parseFloat((Math.ceil(basePrice / 0.5) * 0.5).toFixed(2))); // Ends in .00 or .50
  
  // Suggestion 4: A slight discount (e.g., 2-5%)
  if (basePrice > 0) {
    suggestionsSet.add(parseFloat((basePrice * 0.98).toFixed(2))); // 2% discount
  }

  const formattedSuggestions: { value: number; label: string }[] = [];
  suggestionsSet.forEach(val => {
    const roundedValue = parseFloat(val.toFixed(2));
    if (roundedValue > 0) {
      formattedSuggestions.push({
        value: roundedValue,
        label: formatCurrency(roundedValue, currency) // Use existing formatCurrency
      });
    }
  });

  // Sort, ensure unique by value, and pick top 4
  return formattedSuggestions
    .sort((a, b) => a.value - b.value)
    .filter((item, index, self) => index === self.findIndex((t) => t.value === item.value))
    .slice(0, 4);
}

export function generateDateRange(days: number) {
  const now = new Date();
  const tomorrow = new Date(now.setDate(now.getDate() + 1));
  const endDate = new Date(now.setDate(now.getDate() + days));
  return {
    from: tomorrow,
    to: endDate,
  };
}