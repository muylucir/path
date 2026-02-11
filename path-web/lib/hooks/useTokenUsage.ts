"use client";

import { useState, useCallback, useEffect } from "react";
import type { TokenUsage } from "@/lib/types";

const STORAGE_KEY = "tokenUsage";

const EMPTY_USAGE: TokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  cacheReadInputTokens: 0,
  cacheWriteInputTokens: 0,
  estimatedCostUSD: 0,
};

function loadFromStorage(): TokenUsage {
  if (typeof window === "undefined") return EMPTY_USAGE;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore parse errors
  }
  return EMPTY_USAGE;
}

function saveToStorage(usage: TokenUsage) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // ignore storage errors
  }
}

export function useTokenUsage() {
  const [usage, setUsage] = useState<TokenUsage>(EMPTY_USAGE);

  useEffect(() => {
    setUsage(loadFromStorage());
  }, []);

  const addUsage = useCallback((newUsage: TokenUsage) => {
    setUsage((prev) => {
      const merged: TokenUsage = {
        inputTokens: prev.inputTokens + (newUsage.inputTokens || 0),
        outputTokens: prev.outputTokens + (newUsage.outputTokens || 0),
        totalTokens: prev.totalTokens + (newUsage.totalTokens || 0),
        cacheReadInputTokens:
          (prev.cacheReadInputTokens || 0) +
          (newUsage.cacheReadInputTokens || 0),
        cacheWriteInputTokens:
          (prev.cacheWriteInputTokens || 0) +
          (newUsage.cacheWriteInputTokens || 0),
        estimatedCostUSD: Math.round(
          ((prev.estimatedCostUSD || 0) + (newUsage.estimatedCostUSD || 0)) *
            10000
        ) / 10000,
      };
      saveToStorage(merged);
      setTimeout(() => window.dispatchEvent(new Event("tokenUsageUpdated")), 0);
      return merged;
    });
  }, []);

  // Listen for updates from other hook instances
  useEffect(() => {
    const handleUpdate = () => setUsage(loadFromStorage());
    window.addEventListener("tokenUsageUpdated", handleUpdate);
    return () => window.removeEventListener("tokenUsageUpdated", handleUpdate);
  }, []);

  const resetUsage = useCallback(() => {
    setUsage(EMPTY_USAGE);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setTimeout(() => window.dispatchEvent(new Event("tokenUsageUpdated")), 0);
  }, []);

  return { usage, addUsage, resetUsage };
}
