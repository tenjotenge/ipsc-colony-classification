/**
 * useValidation - Query hook for normalized validation data
 * 
 * Fetches and caches normalized validation data using TanStack Query.
 * Uses the normalized domain model for type safety.
 */

import { useQuery } from "@tanstack/react-query";
import type { NormalizedValidation } from "@/lib/normalizers/types";

// Mock API function - replace with actual API call
async function fetchValidation(analysisId: string): Promise<NormalizedValidation | null> {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/analyses/${analysisId}/validation`);
  // return response.json();
  
  return null;
}

export function useValidation(analysisId?: string) {
  return useQuery({
    queryKey: ["validation", analysisId],
    queryFn: () => fetchValidation(analysisId || ""),
    enabled: !!analysisId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
