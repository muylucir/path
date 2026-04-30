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
import { buildScenario } from "@/lib/simulation/scenario";
import type { Analysis, SpecMeta } from "@/lib/types";
import type { SimStep, ActorKind } from "@/lib/simulation/scenario";

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
  const scenario = useMemo(() => buildScenario(specMeta, analysis), [specMeta, analysis]);
  const specIndex = useMemo(() => buildSpecIndex(specMeta), [specMeta]);

  const [activeIndex, setActiveIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inspectedActorId, setInspectedActorId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);

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
    if (activeIndex < 0 || activeIndex >= scenario.steps.length) return;
    const step = scenario.steps[activeIndex];
    const delay = Math.max(250, step.durationMs / Math.max(0.25, rate));
    timerRef.current = setTimeout(() => {
      setActiveIndex((idx) => {
        if (idx + 1 >= scenario.steps.length) {
          setPlaying(false);
          return idx;
        }
        return idx + 1;
      });
    }, delay);
    return clearTimer;
  }, [playing, activeIndex, scenario.steps, rate, clearTimer]);

  // 활성 카드 오토스크롤
  useEffect(() => {
    if (activeIndex < 0) return;
    activeCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [activeIndex]);

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
    if (scenario.steps.length === 0) return;
    if (activeIndex < 0 || activeIndex >= scenario.steps.length - 1) setActiveIndex(0);
    setPlaying(true);
  };
  const handlePause = () => {
    clearTimer();
    setPlaying(false);
  };
  const handleReset = () => {
    clearTimer();
    setPlaying(false);
    setActiveIndex(-1);
    setInspectedActorId(null);
  };
  const handleStepClick = (step: SimStep) => {
    clearTimer();
    setPlaying(false);
    setActiveIndex(step.index);
    setInspectedActorId(step.actorId);
  };

  const activeStep = activeIndex >= 0 ? scenario.steps[activeIndex] : null;

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
        <StoryHeader userInput={scenario.userInput} />

        <SpaceBetween direction="horizontal" size="xs">
          {!playing ? (
            <Button variant="primary" iconName="caret-right-filled" onClick={handlePlay}>
              {activeIndex < 0 ? "스토리 시작" : "계속 재생"}
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
            {activeIndex >= 0
              ? `스텝 ${activeIndex + 1} / ${scenario.steps.length}`
              : `스텝 0 / ${scenario.steps.length}`}
          </Box>
        </SpaceBetween>

        <ColumnLayout columns={inspected ? 2 : 1} variant="text-grid">
          <div className="sim-story-stage">
            <div className="sim-story-cards">
              {scenario.steps.map((step, i) => (
                <StepCardView
                  key={step.index}
                  step={step}
                  position={positionFor(i, activeIndex)}
                  onClick={() => handleStepClick(step)}
                  cardRef={step.index === activeIndex ? activeCardRef : undefined}
                />
              ))}
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
            {activeIndex < 0 ? (
              <div className="sim-log-empty">재생을 시작하면 여기에 로그가 스트리밍됩니다.</div>
            ) : (
              scenario.steps.slice(0, activeIndex + 1).map((s) => (
                <LogLine
                  key={s.index}
                  step={s}
                  isCurrent={s.index === activeIndex}
                  onClick={() => handleStepClick(s)}
                />
              ))
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
  cardRef?: React.RefObject<HTMLDivElement | null>;
}

const StepCardView = memo(function StepCardView({ step, position, onClick, cardRef }: StepCardProps) {
  const style = KIND_STYLE[step.kind];
  const Icon = style.icon;
  return (
    <div
      ref={cardRef}
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
      {step.promptExcerpt && (
        <div className="sim-card-prompt">
          <span className="sim-card-prompt-tag">PROMPT</span>
          {truncate(step.promptExcerpt, 120)}
        </div>
      )}
      {position === "active" && <div className="sim-pulse-ring" aria-hidden="true" />}
    </div>
  );
});

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
        gap: 16px;
        align-items: stretch;
        min-height: 200px;
        padding: 8px 4px;
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
