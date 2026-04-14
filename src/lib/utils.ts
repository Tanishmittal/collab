import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatFollowers(count: string | number | null | undefined): string {
  if (count == null) return "0";
  
  if (typeof count === "string") {
    const clean = count.trim().toUpperCase();
    if (clean === "" || clean === "N/A") return "0";
    if (clean.endsWith("K") || clean.endsWith("M")) return clean;
    
    const num = parseFloat(clean.replace(/,/g, ""));
    if (isNaN(num)) return count;
    
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
    return num.toLocaleString();
  }
  
  const num = count;
  if (isNaN(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return num.toLocaleString();
}
