"use client";

import { useCallback, useMemo, useState } from "react";
import STYLE_PAIRS from "@/lib/styleVariants";

export type SurveyResponse = {
  pairId: string;
  choice: "A" | "B";
  rtMs: number;
  timestamp: string;
};

export function useSurvey() {
  const [order] = useState<number[]>(() => {
    const indices = STYLE_PAIRS.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  });

  const [responses, setResponses] = useState<SurveyResponse[]>([]);

  const total = STYLE_PAIRS.length;

  const currentIndex = responses.length;
  const currentPair = useMemo(() => STYLE_PAIRS[order[currentIndex]], [order, currentIndex]);

  const recordAnswer = useCallback((pairId: string, choice: "A" | "B", rtMs: number) => {
    setResponses(prev => [...prev, { pairId, choice, rtMs, timestamp: new Date().toISOString() }]);
  }, []);

  const isComplete = responses.length >= total;

  return {
    order,
    currentPair,
    currentIndex: currentIndex + 1,
    total,
    recordAnswer,
    responses,
    isComplete,
  } as const;
}

export default useSurvey;



