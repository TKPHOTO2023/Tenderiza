"use client";

import useSWR from "swr";
import type { Reminder } from "@/lib/reminders";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useReminders() {
  const { data, isLoading, mutate } = useSWR<Reminder[]>("/api/reminders", fetcher);
  return { reminders: data, isLoading, mutate };
}
