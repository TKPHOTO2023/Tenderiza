"use client";

import useSWR from "swr";
import type { CompanyFull } from "@/lib/api-types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCompany() {
  const { data, error, isLoading, mutate } = useSWR<CompanyFull>("/api/company", fetcher);

  async function updateCompany(fields: object) {
    const res = await fetch("/api/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to save your profile. Please try again.");
    }
    const updated = await res.json();
    mutate(updated, { revalidate: false });
    return updated as CompanyFull;
  }

  return { company: data, error, isLoading, mutate, updateCompany };
}

export function useCategories() {
  const { data } = useSWR<{ id: string; code: string; name: string }[]>("/api/categories", fetcher);
  return data ?? [];
}
