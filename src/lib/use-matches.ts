"use client";

import useSWR from "swr";
import type { Match, Tender } from "@prisma/client";
import { fetchJson } from "@/lib/api-client";


export type MatchWithTender = Match & { tender: Tender };

export function useMatches() {
  const { data, isLoading, mutate } = useSWR<MatchWithTender[]>("/api/matches", fetchJson);
  return { matches: data, isLoading, mutate };
}
