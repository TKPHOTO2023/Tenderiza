"use client";

import useSWR from "swr";
import type { DraftStatusLog } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useAuditLog(draftId: string | undefined) {
  const { data, isLoading } = useSWR<DraftStatusLog[]>(draftId ? `/api/drafts/${draftId}/audit` : null, fetcher);
  return { logs: data, isLoading };
}
