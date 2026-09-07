"use client";

import useSWR from "swr";
import type { Match, Tender } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export type MatchWithTender = Match & { tender: Tender };

export function useMatches() {
  const { data, isLoading, mutate } = useSWR<MatchWithTender[]>("/api/matches", fetcher);
  return { matches: data, isLoading, mutate };
}
