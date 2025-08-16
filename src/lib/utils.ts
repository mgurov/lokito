import { type ClassValue, clsx } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildLokiUrl(query: string, start: string) {
  const searchParams = new URLSearchParams();
  searchParams.append("start", start);
  // searching up to now for now searchParams.append('end', '2024-05-09T00:00:00.000Z');
  searchParams.append("direction", "BACKWARD");
  searchParams.append("limit", "1000");
  searchParams.append("query", query);

  return `/loki-proxy/api/v1/query_range?${searchParams.toString()}`;
}

export function randomId() {
  return Math.random().toString(36).substring(2);
}

export function simpleDateTimeFormat(dateTime: string) {
  return dayjs(dateTime).format("YYYY-MM-DD HH:mm:ss");
}

export function daysToHours(days: number) {
  return days * 24;
}

export function reverseDeleteFromArray<T>(arr: T[], predicate: (t: T) => boolean) {
  for (let index = arr.length - 1; index >= 0; index--) {
    if (predicate(arr[index])) {
      arr.splice(index, 1);
    }
  }
}
