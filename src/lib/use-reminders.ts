"use client";

import useSWR from "swr";
import type { Reminder } from "@/lib/reminders";
import { fetchJson } from "@/lib/api-client";


export function useReminders() {
  const { data, isLoading, mutate } = useSWR<Reminder[]>("/api/reminders", fetchJson);
  return { reminders: data, isLoading, mutate };
}
