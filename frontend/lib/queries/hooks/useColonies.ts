/**
 * useColonies - Query hook for normalized colony data
 * 
 * Fetches and caches normalized colony data using TanStack Query.
 * Uses the normalized domain model for type safety.
 */

import { useQuery } from "@tanstack/react-query";
import type { NormalizedColony } from "@/lib/normalizers/types";

// Mock API function - replace with actual API call
async function fetchColonies(analysisId?: string): Promise<NormalizedColony[]> {
  // TODO: Replace with actual API call
  // const url = analysisId ? `/api/analyses/${analysisId}/colonies` : '/api/colonies';
  // const response = await fetch(url);
  // return response.json();
  
  return [];
}

export function useColonies(analysisId?: string) {
  return useQuery({
    queryKey: ["colonies", analysisId],
    queryFn: () => fetchColonies(analysisId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useColony(colonyId: string) {
  return useQuery({
    queryKey: ["colonies", colonyId],
    queryFn: async () => {
      const colonies = await fetchColonies();
      return colonies.find((c) => c.id === colonyId);
    },
    enabled: !!colonyId,
    staleTime: 2 * 60 * 1000,
  });
}
