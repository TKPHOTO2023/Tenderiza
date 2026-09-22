"use client";

import useSWR from "swr";
import type { Draft, Tender } from "@prisma/client";
import { fetchJson } from "@/lib/api-client";


export type DraftWithTender = Draft & { tender: Tender };

export function useDrafts() {
  const { data, isLoading, mutate } = useSWR<DraftWithTender[]>("/api/drafts", fetchJson);
  return { drafts: data, isLoading, mutate };
}
