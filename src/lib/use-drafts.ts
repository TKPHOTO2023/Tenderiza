"use client";

import useSWR from "swr";
import type { Draft, Tender } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type DraftWithTender = Draft & { tender: Tender };

export function useDrafts() {
  const { data, isLoading, mutate } = useSWR<DraftWithTender[]>("/api/drafts", fetcher);
  return { drafts: data, isLoading, mutate };
}
