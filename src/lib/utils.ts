import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DataPoint {
  step: number;
  value: number;
}

export function computeComparatorStatistics(
  data: DataPoint[],
  diff = 5,
  threshold = 0.05
) {
  if (!data || data.length === 0) {
    return {
      curr: "N/A",
      delta: undefined,
      trend: "flat",
      stability: "unknown",
    } as const;
  }

  // Get current (last) and previous (5 steps ago)
  const currPoint = data[data.length - 1];
  const prevPoint = data[data.length - 1 - diff] ?? data[0];

  const curr = Number(currPoint.value.toFixed(3));
  const prev = Number(prevPoint.value.toFixed(3));

  // Avoid division by zero
  const delta =
    prev === 0 ? 0 : Number((((curr - prev) / prev) * 100).toFixed(2));

  const trend = delta > 0 ? "increasing" : delta < 0 ? "decreasing" : "flat";
  const stability = Math.abs(delta) < threshold * 100 ? "stable" : "unstable";

  return { curr, delta, trend, stability } as const;
}

// Simple formatter for 1200 -> 1.2k
export function formatTokens(num: number | string) {
  const n = Number(num);
  if (isNaN(n)) return "0/s";
  if (n < 1000) return `${n.toFixed(0)}/s`;
  return `${(n / 1000).toFixed(1)}k/s`;
}
