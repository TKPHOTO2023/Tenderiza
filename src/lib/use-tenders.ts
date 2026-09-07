"use client";

import useSWR from "swr";
import type { Tender, TenderSyncLog } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface TendersResponse {
  tenders: Tender[];
  filters: { provinces: string[]; categories: string[] };
}

export function useTenders(query: string) {
  const { data, isLoading, mutate } = useSWR<TendersResponse>(`/api/tenders?${query}`, fetcher);
  return { data, isLoading, mutate };
}

export function useSyncStatus() {
  const { data, mutate } = useSWR<TenderSyncLog | null>("/api/tenders/sync", fetcher, {
    refreshInterval: 5000,
  });
  return { lastSync: data, mutate };
}
