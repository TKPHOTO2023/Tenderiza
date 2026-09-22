"use client";

import useSWR from "swr";
import type { DraftStatusLog } from "@prisma/client";
import { fetchJson } from "@/lib/api-client";


export function useAuditLog(draftId: string | undefined) {
  const { data, isLoading } = useSWR<DraftStatusLog[]>(draftId ? `/api/drafts/${draftId}/audit` : null, fetchJson);
  return { logs: data, isLoading };
}
