"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Badge from "@cloudscape-design/components/badge";
import Button from "@cloudscape-design/components/button";
import Select from "@cloudscape-design/components/select";
import Input from "@cloudscape-design/components/input";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import {
  User,
  Brain,
  Database,
  Wrench,
  FileCheck,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { buildScenario, collectInputPresets } from "@/lib/simulation/scenario";
import type { Analysis, SpecMeta } from "@/lib/types";
import type { SimStep, ActorKind, InputPreset } from "@/lib/simulation/scenario";

interface SimulationL2TabProps {
  specMeta: SpecMeta | null;
  analysis: Analysis;
}

const SPEED_OPTIONS = [
  { label: "0.5x", value: "0.5" },
  { label: "1x", value: "1" },
  { label: "2x", value: "2" },
  { label: "4x", value: "4" },
];

const KIND_STYLE: Record<
  ActorKind,
  { bg: string; fg: string; accent: string; icon: LucideIcon; label: string }
> = {
  user: {
    bg: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    fg: "#0b3d91",
    accent: "#1168bd",
    icon: User,
    label: "사용자",
  },
  agent: {
    bg: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
    fg: "#3a1e8a",
    accent: "#6c3ad6",
    icon: Brain,
    label: "에이전트",
  },
  tool: {
    bg: "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
    fg: "#7a4a00",
    accent: "#d98500",
    icon: Wrench,
    label: "도구",
  },
  data: {
    bg: "linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)",
    fg: "#0f5123",
    accent: "#1b8a3a",
    icon: Database,
    label: "데이터",
  },
  output: {
    bg: "linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)",
    fg: "#7a1c10",
    accent: "#c4321e",
    icon: FileCheck,
    label: "산출물",
  },
};

/**
 * L2 시뮬레이션 — "러닝 카드" + 로그 트레이스 조합.
 * 재생하면 카드가 등장·펄스하며 하단에 로그가 쌓인다.
 */
export function SimulationL2Tab({ specMeta, analysis }: SimulationL2TabProps) {
  const presets = useMemo(() => collectInputPresets(specMeta, analysis), [specMeta, analysis]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => presets[0]?.id ?? "custom");
  const [customDraft, setCustomDraft] = useState<string>("");
  const [appliedCustom, setAppliedCustom] = useState<string>("");

  const userInputOverride = useMemo(() => {
    if (selectedPresetId === "custom") return appliedCustom || null;
    return presets.find((p) => p.id === selectedPresetId)?.text ?? null;
  }, [selectedPresetId, appliedCustom, presets]);

  const scenario = useMemo(
    () => buildScenario(specMeta, analysis, { userInputOverride }),
    [specMeta, analysis, userInputOverride],
  );
  const specIndex = useMemo(() => buildSpecIndex(specMeta), [specMeta]);

  const [activeGroupIndex, setActiveGroupIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inspectedActorId, setInspectedActorId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const activeGroupRef = useRef<HTMLDivElement>(null);

  const groups = scenario.groupedSteps;
  const activeGroup = activeGroupIndex >= 0 ? groups[activeGroupIndex] : null;
  const flatActiveIndex = activeGroup ? activeGroup[activeGroup.length - 1].index : -1;
  const visibleStepsEndIndex = flatActiveIndex;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    clearTimer();
    if (!playing) return;
    if (activeGroupIndex < 0 || activeGroupIndex >= groups.length) return;
    const group = groups[activeGroupIndex];
    const maxDuration = group.reduce((m, s) => Math.max(m, s.durationMs), 0);
    const delay = Math.max(250, maxDuration / Math.max(0.25, rate));
    timerRef.current = setTimeout(() => {
      setActiveGroupIndex((idx) => {
        if (idx + 1 >= groups.length) {
          setPlaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, delay);
    return clearTimer;
  }, [playing, activeGroupIndex, groups, rate, clearTimer]);

  // 활성 그룹 오토스크롤
  useEffect(() => {
    if (activeGroupIndex < 0) return;
    activeGroupRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [activeGroupIndex]);

  // 입력이 바뀌면 재생/인스펙터 리셋
  useEffect(() => {
    clearTimer();
    setPlaying(false);
    setActiveGroupIndex(-1);
    setInspectedActorId(null);
  }, [userInputOverride, clearTimer]);

  const inspected = useMemo(
    () => (inspectedActorId && specIndex ? resolveInspect(inspectedActorId, specIndex) : null),
    [inspectedActorId, specIndex],
  );

  if (!specMeta) {
    return (
      <Container header={<Header variant="h2">실행 흐름 미리보기</Header>}>
        <Alert type="info" header="명세서 생성이 필요합니다">
          명세서 탭에서 명세서를 생성하면 여기서 에이전트 실행 흐름을 확인할 수 있습니다.
        </Alert>
      </Container>
    );
  }

  const handlePlay = () => {
    if (groups.length === 0) return;
    if (activeGroupIndex < 0 || activeGroupIndex >= groups.length - 1) setActiveGroupIndex(0);
    setPlaying(true);
  };
  const handlePause = () => {
    clearTimer();
    setPlaying(false);
  };
  const handleReset = () => {
    clearTimer();
    setPlaying(false);
    setActiveGroupIndex(-1);
    setInspectedActorId(null);
  };
  const handleStepClick = (step: SimStep) => {
    clearTimer();
    setPlaying(false);
    const groupIdx = groups.findIndex((g) => g.some((s) => s.index === step.index));
    if (groupIdx >= 0) setActiveGroupIndex(groupIdx);
    setInspectedActorId(step.actorId);
  };

  const activeStep = activeGroup ? activeGroup[activeGroup.length - 1] : null;

  return (
    <Container
      header={
        <Header
          variant="h2"
          description="재생 버튼을 눌러 에이전트의 실행 흐름을 스토리처럼 따라가세요. 카드를 클릭하면 상세를 볼 수 있습니다."
        >
          실행 흐름 스토리
        </Header>
      }
    >
      <SimStyles />
      <SpaceBetween size="l">
        <InputPicker
          presets={presets}
          selectedId={selectedPresetId}
          onSelect={setSelectedPresetId}
          customDraft={customDraft}
          onCustomDraftChange={setCustomDraft}
          onApplyCustom={() => setAppliedCustom(customDraft)}
          appliedCustom={appliedCustom}
        />
        <StoryHeader userInput={scenario.userInput} />

        <SpaceBetween direction="horizontal" size="xs">
          {!playing ? (
            <Button variant="primary" iconName="caret-right-filled" onClick={handlePlay}>
              {activeGroupIndex < 0 ? "스토리 시작" : "계속 재생"}
            </Button>
          ) : (
            <Button iconName="status-stopped" onClick={handlePause}>
              일시정지
            </Button>
          )}
          <Button iconName="refresh" onClick={handleReset}>
            처음부터
          </Button>
          <Box padding={{ left: "xs" }}>
            <Select
              selectedOption={{ label: `${rate}x`, value: String(rate) }}
              onChange={({ detail }) => setRate(parseFloat(detail.selectedOption.value ?? "1"))}
              options={SPEED_OPTIONS}
              expandToViewport
            />
          </Box>
          <Box padding={{ left: "s", top: "xs" }} color="text-body-secondary">
            {activeGroupIndex >= 0
              ? `단계 ${activeGroupIndex + 1} / ${groups.length}`
              : `단계 0 / ${groups.length}`}
          </Box>
        </SpaceBetween>

        <ColumnLayout columns={inspected ? 2 : 1} variant="text-grid">
          <div className="sim-story-stage">
            <div className="sim-story-cards">
              {groups.map((group, gi) => {
                const position = positionFor(gi, activeGroupIndex);
                const isParallel = group.length > 1;
                return (
                  <div
                    key={`g-${gi}`}
                    className={`sim-group${isParallel ? " sim-group-parallel" : ""}`}
                    ref={gi === activeGroupIndex ? activeGroupRef : undefined}
                  >
                    {isParallel && (
                      <div className="sim-group-caption" aria-hidden="true">
                        ⑂ 병렬 실행 · {group.length}개 동시
                      </div>
                    )}
                    <div className="sim-group-cards">
                      {group.map((step) => (
                        <StepCardView
                          key={step.index}
                          step={step}
                          position={position}
                          onClick={() => handleStepClick(step)}
                          rate={rate}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {inspected && (
            <Container
              header={
                <Header
                  variant="h3"
                  actions={
                    <Button
                      iconName="close"
                      variant="icon"
                      onClick={() => setInspectedActorId(null)}
                      ariaLabel="닫기"
                    />
                  }
                >
                  {inspected.title}
                </Header>
              }
            >
              <SpaceBetween size="s">
                <Badge color={inspected.badgeColor}>{inspected.subtitle}</Badge>
                {inspected.bodyLines.map((line, i) => (
                  <Box key={i}>
                    <Box variant="awsui-key-label">{line.label}</Box>
                    <Box variant="code">
                      <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{line.value}</pre>
                    </Box>
                  </Box>
                ))}
              </SpaceBetween>
            </Container>
          )}
        </ColumnLayout>

        <Container
          header={<Header variant="h3" description="현재까지 실행된 단계의 라이브 로그입니다. 줄을 클릭하면 해당 단계로 이동합니다.">실행 로그</Header>}
        >
          <div ref={logRef} className="sim-log">
            {visibleStepsEndIndex < 0 ? (
              <div className="sim-log-empty">재생을 시작하면 여기에 로그가 스트리밍됩니다.</div>
            ) : (
              scenario.steps.slice(0, visibleStepsEndIndex + 1).map((s) => {
                const isCurrent = !!activeGroup && activeGroup.some((g) => g.index === s.index);
                return (
                  <LogLine
                    key={s.index}
                    step={s}
                    isCurrent={isCurrent}
                    onClick={() => handleStepClick(s)}
                  />
                );
              })
            )}
          </div>
        </Container>

        {activeStep && (
          <Alert type="info" header={`지금: ${activeStep.summary}`}>
            {activeStep.detail || activeStep.promptExcerpt || "카드를 클릭하면 프롬프트·설정을 볼 수 있습니다."}
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );
}

// ──────────────────────────────────────────────────────────
// Subcomponents
// ──────────────────────────────────────────────────────────

const StoryHeader = memo(function StoryHeader({ userInput }: { userInput: string }) {
  return (
    <div className="sim-hero">
      <div className="sim-hero-label">사용자 입력</div>
      <div className="sim-hero-text">&ldquo;{userInput}&rdquo;</div>
    </div>
  );
});

interface InputPickerProps {
  presets: InputPreset[];
  selectedId: string;
  onSelect: (id: string) => void;
  customDraft: string;
  onCustomDraftChange: (v: string) => void;
  onApplyCustom: () => void;
  appliedCustom: string;
}

const InputPicker = memo(function InputPicker({
  presets,
  selectedId,
  onSelect,
  customDraft,
  onCustomDraftChange,
  onApplyCustom,
  appliedCustom,
}: InputPickerProps) {
  const isCustom = selectedId === "custom";
  return (
    <div className="sim-picker">
      <div className="sim-picker-label">입력 바꿔보기</div>
      <div className="sim-picker-chips">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`sim-chip${selectedId === p.id ? " sim-chip-active" : ""}`}
            onClick={() => onSelect(p.id)}
            title={p.text}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className={`sim-chip sim-chip-custom${isCustom ? " sim-chip-active" : ""}`}
          onClick={() => onSelect("custom")}
        >
          ✎ 직접 입력
        </button>
      </div>
      {isCustom && (
        <div className="sim-picker-custom">
          <div style={{ flex: 1 }}>
            <Input
              value={customDraft}
              onChange={({ detail }) => onCustomDraftChange(detail.value)}
              placeholder="예: 지난 주 환불 건 중 5만원 이상인 것만 보여줘"
              onKeyDown={({ detail }) => {
                if (detail.key === "Enter") onApplyCustom();
              }}
            />
          </div>
          <Button
            variant="primary"
            onClick={onApplyCustom}
            disabled={!customDraft.trim() || customDraft.trim() === appliedCustom.trim()}
          >
            적용
          </Button>
        </div>
      )}
    </div>
  );
});

type CardPosition = "past" | "active" | "upcoming" | "far";

function positionFor(i: number, active: number): CardPosition {
  if (active < 0) return i === 0 ? "upcoming" : "far";
  if (i === active) return "active";
  if (i < active) return "past";
  if (i === active + 1) return "upcoming";
  return "far";
}

interface StepCardProps {
  step: SimStep;
  position: CardPosition;
  onClick: () => void;
  rate: number;
}

const StepCardView = memo(function StepCardView({ step, position, onClick, rate }: StepCardProps) {
  const style = KIND_STYLE[step.kind];
  const Icon = style.icon;
  const isActive = position === "active";
  const spoken = step.spokenLines ?? [];
  const typed = useTypedLines(spoken, isActive, rate);
  return (
    <div
      className={`sim-card sim-card-${position}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      style={
        {
          background: style.bg,
          color: style.fg,
          "--sim-accent": style.accent,
        } as React.CSSProperties
      }
    >
      <div className="sim-card-head">
        <Icon size={20} color={style.accent} strokeWidth={2.2} />
        <span className="sim-card-kind">{style.label}</span>
        <span className="sim-card-idx">#{step.index + 1}</span>
      </div>
      <div className="sim-card-title">{step.summary}</div>
      {step.detail && <div className="sim-card-detail">{truncate(step.detail, 140)}</div>}
      {spoken.length > 0 && (
        <div className="sim-card-bubble" aria-live={isActive ? "polite" : "off"}>
          {typed.map((line, i) => (
            <div key={i} className="sim-bubble-line">
              {line}
              {isActive && i === typed.length - 1 && line.length < spoken[i]!.length && (
                <span className="sim-caret" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      )}
      {step.promptExcerpt && (
        <div className="sim-card-prompt">
          <span className="sim-card-prompt-tag">PROMPT</span>
          {truncate(step.promptExcerpt, 120)}
        </div>
      )}
      {isActive && <div className="sim-pulse-ring" aria-hidden="true" />}
    </div>
  );
});

/**
 * 활성 카드에 한해 라인별 타이핑 애니메이션. rate >= 4면 즉시 표시.
 */
function useTypedLines(lines: string[] | undefined, active: boolean, rate: number): string[] {
  // lines는 step.spokenLines ?? [] 형태로 들어오지만, 예기치 않게 undefined 원소가 섞여
  // 들어올 수 있어 방어적으로 한 번 더 필터링한다. 과거 렌더 주기에서 lines 배열이
  // 짧아진 뒤 setTimeout으로 지연된 setState가 발화하면 lines[lineIdx]가 undefined가
  // 되어 .slice() 호출이 터지는 문제가 있었다.
  const safeLines = Array.isArray(lines) ? lines.filter((l): l is string => typeof l === "string") : [];
  const fullKey = safeLines.join(" ");
  const [typed, setTyped] = useState<string[]>(() =>
    active && rate < 4 ? safeLines.map(() => "") : safeLines.slice(),
  );

  useEffect(() => {
    if (!active || rate >= 4 || safeLines.length === 0) {
      setTyped(safeLines.slice());
      return;
    }
    setTyped(safeLines.map(() => ""));
    const perChar = Math.max(10, 38 / Math.max(0.5, rate));
    let lineIdx = 0;
    let charIdx = 0;
    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      if (cancelled) return;
      if (lineIdx >= safeLines.length) return;
      const currentLine = safeLines[lineIdx];
      if (typeof currentLine !== "string") return;
      charIdx++;
      setTyped((prev) => {
        const base = prev.length === safeLines.length ? prev : safeLines.map(() => "");
        const copy = base.slice();
        copy[lineIdx] = currentLine.slice(0, charIdx);
        return copy;
      });
      if (charIdx >= currentLine.length) {
        lineIdx++;
        charIdx = 0;
        if (lineIdx < safeLines.length) {
          timerId = setTimeout(tick, perChar * 6);
          return;
        }
        return;
      }
      timerId = setTimeout(tick, perChar);
    };
    timerId = setTimeout(tick, perChar);
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
    // fullKey로 동일 라인 재생 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey, active, rate]);

  return typed;
}

const LogLine = memo(function LogLine({
  step,
  isCurrent,
  onClick,
}: {
  step: SimStep;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const style = KIND_STYLE[step.kind];
  return (
    <div
      className={`sim-log-line${isCurrent ? " sim-log-current" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span className="sim-log-time">T+{String(step.index + 1).padStart(2, "0")}</span>
      <span className="sim-log-kind" style={{ color: style.accent }}>
        [{style.label}]
      </span>
      <ChevronRight size={14} style={{ opacity: 0.5 }} />
      <span className="sim-log-msg">{step.summary}</span>
    </div>
  );
});

// ──────────────────────────────────────────────────────────
// Styles
// ──────────────────────────────────────────────────────────

const SimStyles = memo(function SimStyles() {
  return (
    <style>{`
      .sim-picker {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .sim-picker-label {
        font-size: 11px;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #64748b;
        font-weight: 600;
      }
      .sim-picker-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .sim-chip {
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        color: #334155;
        font-size: 12.5px;
        cursor: pointer;
        transition: all 160ms ease;
      }
      .sim-chip:hover {
        border-color: #6c3ad6;
        color: #6c3ad6;
      }
      .sim-chip-active {
        background: #6c3ad6;
        color: #fff;
        border-color: #6c3ad6;
        box-shadow: 0 4px 10px -4px rgba(108, 58, 214, 0.5);
      }
      .sim-chip-custom {
        font-style: italic;
      }
      .sim-picker-custom {
        display: flex;
        gap: 8px;
        align-items: flex-start;
      }

      .sim-hero {
        padding: 20px 24px;
        border-radius: 12px;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        color: #e2e8f0;
        box-shadow: 0 10px 30px -12px rgba(15, 23, 42, 0.4);
      }
      .sim-hero-label {
        font-size: 11px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #94a3b8;
        margin-bottom: 8px;
      }
      .sim-hero-text {
        font-size: 18px;
        font-weight: 500;
        line-height: 1.5;
      }

      .sim-story-stage {
        position: relative;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 16px 8px;
        background: repeating-linear-gradient(
          90deg,
          #f8fafc 0px,
          #f8fafc 1px,
          transparent 1px,
          transparent 80px
        ), #ffffff;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }
      .sim-story-cards {
        display: flex;
        gap: 24px;
        align-items: stretch;
        min-height: 200px;
        padding: 8px 4px;
      }

      .sim-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .sim-group-cards {
        display: flex;
        gap: 12px;
        align-items: stretch;
      }
      .sim-group-parallel {
        position: relative;
        padding: 6px 10px 6px 14px;
        border-radius: 12px;
        background: rgba(108, 58, 214, 0.04);
        border: 1px dashed rgba(108, 58, 214, 0.35);
      }
      .sim-group-parallel::before {
        content: "";
        position: absolute;
        left: 4px;
        top: 10%;
        bottom: 10%;
        width: 3px;
        border-radius: 3px;
        background: linear-gradient(180deg, #a78bfa, #6c3ad6);
      }
      .sim-group-caption {
        font-size: 10.5px;
        letter-spacing: 1px;
        font-weight: 700;
        color: #6c3ad6;
        text-transform: uppercase;
        padding: 0 4px;
      }

      .sim-card {
        position: relative;
        flex: 0 0 260px;
        min-height: 180px;
        padding: 16px;
        border-radius: 14px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        transition: transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
                    opacity 260ms ease,
                    box-shadow 260ms ease,
                    filter 260ms ease;
        border: 2px solid transparent;
      }
      .sim-card:focus-visible {
        outline: 2px solid var(--sim-accent);
        outline-offset: 3px;
      }

      .sim-card-past {
        opacity: 0.5;
        filter: saturate(0.8);
        transform: scale(0.94);
      }
      .sim-card-upcoming {
        opacity: 0.85;
        filter: blur(0.3px);
      }
      .sim-card-far {
        opacity: 0.45;
        filter: blur(1.2px);
        transform: scale(0.92);
      }
      .sim-card-active {
        transform: scale(1.06) translateY(-4px);
        box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.25),
                    0 0 0 3px var(--sim-accent);
        border-color: var(--sim-accent);
        z-index: 2;
      }

      .sim-card-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }
      .sim-card-kind {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 1.2px;
        text-transform: uppercase;
      }
      .sim-card-idx {
        margin-left: auto;
        font-size: 11px;
        font-weight: 600;
        opacity: 0.7;
      }
      .sim-card-title {
        font-size: 15px;
        font-weight: 700;
        line-height: 1.35;
        margin-bottom: 8px;
      }
      .sim-card-detail {
        font-size: 12px;
        line-height: 1.5;
        opacity: 0.85;
      }
      .sim-card-prompt {
        margin-top: 10px;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.55);
        border-radius: 8px;
        font-size: 11px;
        line-height: 1.5;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      }
      .sim-card-prompt-tag {
        display: inline-block;
        margin-right: 6px;
        padding: 1px 6px;
        background: var(--sim-accent);
        color: #fff;
        border-radius: 3px;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.5px;
        vertical-align: 1px;
      }

      .sim-card-bubble {
        margin-top: 10px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.92);
        color: #0f172a;
        border-radius: 12px;
        border-top-left-radius: 4px;
        font-size: 12.5px;
        line-height: 1.55;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
        position: relative;
      }
      .sim-card-bubble::before {
        content: "";
        position: absolute;
        left: -6px;
        top: 6px;
        width: 0;
        height: 0;
        border-top: 8px solid transparent;
        border-bottom: 8px solid transparent;
        border-right: 8px solid rgba(255, 255, 255, 0.92);
      }
      .sim-bubble-line {
        white-space: pre-wrap;
      }
      .sim-bubble-line + .sim-bubble-line {
        margin-top: 4px;
      }
      .sim-caret {
        display: inline-block;
        width: 2px;
        height: 1em;
        margin-left: 1px;
        background: currentColor;
        vertical-align: -2px;
        animation: sim-caret-blink 0.9s steps(2) infinite;
      }
      @keyframes sim-caret-blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }

      @keyframes sim-pulse {
        0%   { box-shadow: 0 0 0 0   var(--sim-accent); opacity: 0.7; }
        70%  { box-shadow: 0 0 0 14px transparent; opacity: 0; }
        100% { box-shadow: 0 0 0 0   transparent; opacity: 0; }
      }
      .sim-pulse-ring {
        position: absolute;
        inset: -4px;
        border-radius: 18px;
        pointer-events: none;
        animation: sim-pulse 1.4s ease-out infinite;
      }

      .sim-log {
        max-height: 220px;
        overflow-y: auto;
        background: #0f172a;
        color: #e2e8f0;
        border-radius: 8px;
        padding: 12px 14px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 12.5px;
        line-height: 1.7;
      }
      .sim-log-empty {
        color: #64748b;
        font-style: italic;
      }
      @keyframes sim-log-in {
        from { opacity: 0; transform: translateX(-6px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .sim-log-line {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        animation: sim-log-in 240ms ease-out both;
      }
      .sim-log-line:hover {
        background: rgba(148, 163, 184, 0.15);
      }
      .sim-log-current {
        background: rgba(108, 58, 214, 0.25);
        box-shadow: inset 2px 0 0 #a78bfa;
      }
      .sim-log-time {
        color: #64748b;
        font-size: 11px;
      }
      .sim-log-kind {
        font-weight: 700;
        font-size: 11px;
        letter-spacing: 0.5px;
      }
      .sim-log-msg {
        flex: 1;
        color: #f1f5f9;
      }
    `}</style>
  );
});

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}

// ──────────────────────────────────────────────────────────
// Inspector indexing
// ──────────────────────────────────────────────────────────

interface SpecIndex {
  agentPromptsByName: Map<string, SpecMeta["agent_prompts"][number]>;
  agentComponentsByName: Map<string, SpecMeta["design_summary"]["agent_components"][number]>;
  toolsByName: Map<string, SpecMeta["tools"][number]>;
  dataSourceById: Map<string, SpecMeta["data_integrations"]["items"][number]>;
}

function buildSpecIndex(specMeta: SpecMeta | null): SpecIndex | null {
  if (!specMeta) return null;
  return {
    agentPromptsByName: new Map((specMeta.agent_prompts ?? []).map((p) => [p.agent_name, p])),
    agentComponentsByName: new Map(
      (specMeta.design_summary?.agent_components ?? []).map((c) => [c.name, c]),
    ),
    toolsByName: new Map((specMeta.tools ?? []).map((t) => [t.name, t])),
    dataSourceById: new Map((specMeta.data_integrations?.items ?? []).map((d) => [d.ds_id, d])),
  };
}

function resolveInspect(
  actorId: string,
  idx: SpecIndex,
): {
  title: string;
  subtitle: string;
  badgeColor: "blue" | "green" | "grey" | "red";
  bodyLines: { label: string; value: string }[];
} | null {
  if (actorId.startsWith("agent:")) {
    const name = actorId.slice("agent:".length);
    const match = idx.agentPromptsByName.get(name);
    const comp = idx.agentComponentsByName.get(name);
    const body: { label: string; value: string }[] = [];
    if (comp?.role) body.push({ label: "역할", value: comp.role });
    if (match?.system_prompt) body.push({ label: "System Prompt", value: match.system_prompt });
    if (match?.example_prompt) body.push({ label: "Example Prompt", value: match.example_prompt });
    if (body.length === 0) body.push({ label: "정보", value: "추가 세부 정보가 없습니다." });
    return { title: name, subtitle: "에이전트", badgeColor: "blue", bodyLines: body };
  }
  if (actorId.startsWith("tool:")) {
    const name = actorId.slice("tool:".length);
    const tool = idx.toolsByName.get(name);
    const body = [
      { label: "Purpose", value: tool?.purpose || "-" },
      { label: "Signature", value: tool?.signature || "-" },
      { label: "When to use", value: tool?.when_to_use || "-" },
    ];
    return { title: name, subtitle: "도구", badgeColor: "grey", bodyLines: body };
  }
  if (actorId.startsWith("data:")) {
    const dsId = actorId.slice("data:".length);
    const ds = idx.dataSourceById.get(dsId);
    const body: { label: string; value: string }[] = [];
    if (ds?.connection) body.push({ label: "Connection", value: ds.connection });
    if (ds?.auth_flow) body.push({ label: "Auth Flow", value: ds.auth_flow });
    if (ds?.example_queries?.length) body.push({ label: "Example", value: ds.example_queries[0] });
    if (body.length === 0) body.push({ label: "정보", value: "추가 세부 정보가 없습니다." });
    return { title: ds?.ds_name || dsId, subtitle: "데이터 소스", badgeColor: "green", bodyLines: body };
  }
  if (actorId === "__user__") {
    return { title: "사용자", subtitle: "입력", badgeColor: "blue", bodyLines: [{ label: "입력", value: "시뮬레이션 입력 참조" }] };
  }
  if (actorId === "__output__") {
    return { title: "최종 산출물", subtitle: "출력", badgeColor: "red", bodyLines: [{ label: "형태", value: "분석 결과에 따라 생성됨" }] };
  }
  return null;
}
