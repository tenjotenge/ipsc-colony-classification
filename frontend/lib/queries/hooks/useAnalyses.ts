/**
 * useAnalyses - Query hook for normalized analysis data
 * 
 * Fetches and caches normalized analysis data using TanStack Query.
 * Uses the normalized domain model for type safety.
 */

import { useQuery } from "@tanstack/react-query";
import type { NormalizedAnalysis } from "@/lib/normalizers/types";

// Mock API function - replace with actual API call
async function fetchAnalyses(runId?: string): Promise<NormalizedAnalysis[]> {
  // TODO: Replace with actual API call
  // const url = runId ? `/api/runs/${runId}/analyses` : '/api/analyses';
  // const response = await fetch(url);
  // return response.json();
  
  return [];
}

export function useAnalyses(runId?: string) {
  return useQuery({
    queryKey: ["analyses", runId],
    queryFn: () => fetchAnalyses(runId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAnalysis(analysisId: string) {
  return useQuery({
    queryKey: ["analyses", analysisId],
    queryFn: async () => {
      const analyses = await fetchAnalyses();
      return analyses.find((a) => a.id === analysisId);
    },
    enabled: !!analysisId,
    staleTime: 5 * 60 * 1000,
  });
}
