import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Text colour token for a 0–100 score. */
export function scoreTone(score: number) {
  if (score >= 75) return "text-good";
  if (score >= 60) return "text-warn";
  return "text-bad";
}

export function scoreBar(score: number) {
  if (score >= 75) return "bg-good";
  if (score >= 60) return "bg-warn";
  return "bg-bad";
}
