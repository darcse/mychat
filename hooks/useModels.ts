"use client";

import { useEffect, useState } from "react";
import type { ModelOption, ModelsResponse } from "@/types/models";

export function useModels() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModels() {
      setIsLoading(true);
      setIsReady(false);
      setError(null);

      try {
        const response = await fetch("/api/models");
        const data = (await response.json()) as ModelsResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "모델 목록을 불러오지 못했습니다.");
        }

        if (!cancelled) {
          setModels(data.models ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "모델 목록을 불러오지 못했습니다.",
          );
          setModels([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    }

    loadModels();
    return () => {
      cancelled = true;
    };
  }, []);

  return { models, isLoading, isReady, error };
}
