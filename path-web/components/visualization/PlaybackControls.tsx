"use client";

import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Select from "@cloudscape-design/components/select";
import type { UsePlaybackResult } from "@/lib/simulation/usePlayback";

interface PlaybackControlsProps {
  playback: UsePlaybackResult;
  totalSteps: number;
  compact?: boolean;
}

const RATE_OPTIONS = [
  { label: "0.5x", value: "0.5" },
  { label: "1x", value: "1" },
  { label: "1.5x", value: "1.5" },
  { label: "2x", value: "2" },
];

export function PlaybackControls({ playback, totalSteps, compact = false }: PlaybackControlsProps) {
  const { playing, currentIndex, play, pause, next, prev, reset, rate, setRate } = playback;
  const atEnd = currentIndex >= totalSteps - 1;
  const selected = RATE_OPTIONS.find((o) => o.value === String(rate)) ?? RATE_OPTIONS[1];

  return (
    <Box padding={{ vertical: "xs" }}>
      <SpaceBetween direction="horizontal" size="xs" alignItems="center">
        <Button
          variant="primary"
          iconName={playing ? "status-pending" : "caret-right-filled"}
          onClick={() => (playing ? pause() : play())}
          disabled={totalSteps === 0}
        >
          {playing ? "일시정지" : currentIndex < 0 ? "재생" : atEnd ? "처음부터" : "계속"}
        </Button>
        <Button iconName="angle-left" onClick={prev} disabled={currentIndex <= 0}>
          이전
        </Button>
        <Button iconName="angle-right" onClick={next} disabled={atEnd || totalSteps === 0}>
          다음
        </Button>
        <Button iconName="refresh" onClick={reset} disabled={currentIndex < 0 && !playing}>
          리셋
        </Button>
        {!compact && (
          <Box padding={{ left: "s" }}>
            <SpaceBetween direction="horizontal" size="xxs" alignItems="center">
              <Box variant="small" color="text-body-secondary">속도</Box>
              <Select
                selectedOption={selected}
                options={RATE_OPTIONS}
                onChange={({ detail }) => setRate(parseFloat(detail.selectedOption.value!))}
              />
            </SpaceBetween>
          </Box>
        )}
        <Box variant="small" color="text-body-secondary">
          {currentIndex < 0 ? "대기" : `${currentIndex + 1} / ${totalSteps}`}
        </Box>
      </SpaceBetween>
    </Box>
  );
}
