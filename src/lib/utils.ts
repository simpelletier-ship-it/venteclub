import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "CAD"): string {
  const symbol = currency === "USD" ? "$" : "$";
  return `${symbol}${amount.toLocaleString("fr-CA")}`;
}
