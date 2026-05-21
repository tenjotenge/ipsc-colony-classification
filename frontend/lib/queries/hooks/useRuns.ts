/**
 * useRuns - Query hook for normalized run data
 * 
 * Fetches and caches normalized run data using TanStack Query.
 * Uses the normalized domain model for type safety.
 */

import { useQuery } from "@tanstack/react-query";
import type { NormalizedRun } from "@/lib/normalizers/types";

// Mock API function - replace with actual API call
async function fetchRuns(): Promise<NormalizedRun[]> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/runs');
  // return response.json();
  
  return [];
}

export function useRuns() {
  return useQuery({
    queryKey: ["runs"],
    queryFn: fetchRuns,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRun(runId: string) {
  return useQuery({
    queryKey: ["runs", runId],
    queryFn: async () => {
      const runs = await fetchRuns();
      return runs.find((r) => r.id === runId);
    },
    enabled: !!runId,
    staleTime: 10 * 60 * 1000,
  });
}
