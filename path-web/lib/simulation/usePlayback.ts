"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SimStep } from "@/lib/simulation/scenario";

export interface UsePlaybackOptions {
  steps: SimStep[];
  initialRate?: number;
}

export interface UsePlaybackResult {
  currentIndex: number;
  playing: boolean;
  rate: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (index: number) => void;
  reset: () => void;
  setRate: (rate: number) => void;
}

/**
 * 스크립트된 시뮬레이션 재생 훅. setTimeout 기반이라 결정적이고 정지/재개가 가능.
 * 스텝 `durationMs` / rate 로 실시간 속도 조절.
 */
export function usePlayback({ steps, initialRate = 1 }: UsePlaybackOptions): UsePlaybackResult {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(initialRate);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    clearTimer();
    setPlaying(false);
  }, [clearTimer]);

  const play = useCallback(() => {
    if (steps.length === 0) return;
    setCurrentIndex((idx) => (idx < 0 || idx >= steps.length ? 0 : idx));
    setPlaying(true);
  }, [steps.length]);

  const toggle = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  const next = useCallback(() => {
    setCurrentIndex((idx) => Math.min(idx + 1, steps.length - 1));
  }, [steps.length]);

  const prev = useCallback(() => {
    setCurrentIndex((idx) => Math.max(idx - 1, 0));
  }, []);

  const seek = useCallback((index: number) => {
    setCurrentIndex(Math.max(-1, Math.min(index, steps.length - 1)));
  }, [steps.length]);

  const reset = useCallback(() => {
    clearTimer();
    setPlaying(false);
    setCurrentIndex(-1);
  }, [clearTimer]);

  // 자동 진행: 현재 스텝의 durationMs 이후 다음 스텝으로
  useEffect(() => {
    clearTimer();
    if (!playing) return;
    if (currentIndex < 0 || currentIndex >= steps.length) return;
    const step = steps[currentIndex];
    const delay = Math.max(200, step.durationMs / Math.max(0.25, rate));
    timerRef.current = setTimeout(() => {
      setCurrentIndex((idx) => {
        if (idx + 1 >= steps.length) {
          setPlaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, delay);
    return clearTimer;
  }, [playing, currentIndex, steps, rate, clearTimer]);

  // steps 배열이 달라지면(명세서 재생성 등) 소비자가 컴포넌트를 key로 remount 하는 것을
  // 가정. 여기선 내부 상태에 대해 out-of-bound 체크만 자연스럽게 처리한다.

  return {
    currentIndex,
    playing,
    rate,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    reset,
    setRate,
  };
}
