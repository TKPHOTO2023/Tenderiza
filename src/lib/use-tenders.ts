"use client";

import useSWR from "swr";
import type { Tender, TenderSyncLog } from "@prisma/client";
import { fetchJson } from "@/lib/api-client";


export interface TendersResponse {
  tenders: Tender[];
  filters: { provinces: string[]; categories: string[] };
}

export function useTenders(query: string) {
  const { data, isLoading, mutate } = useSWR<TendersResponse>(`/api/tenders?${query}`, fetchJson);
  return { data, isLoading, mutate };
}

export function useSyncStatus() {
  const { data, mutate } = useSWR<TenderSyncLog | null>("/api/tenders/sync", fetchJson, {
    refreshInterval: 5000,
  });
  return { lastSync: data, mutate };
}
