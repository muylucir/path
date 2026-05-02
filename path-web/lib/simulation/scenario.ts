import type { Analysis, SpecMeta, SpecMetaDiagram } from "@/lib/types";

export type ActorKind = "user" | "agent" | "tool" | "data" | "output";

export interface SimActor {
  id: string;
  label: string;
  kind: ActorKind;
}

export interface SimStep {
  index: number;
  actorId: string;
  kind: ActorKind;
  summary: string;
  detail?: string;
  promptExcerpt?: string;
  toolCall?: { name: string; signature?: string; purpose?: string };
  dataCall?: { ds_id: string; ds_name?: string; example?: string };
  durationMs: number;
  /** 같은 parallelGroup 값을 가진 스텝은 시간적으로 겹칠 수 있음 */
  parallelGroup: number;
  /** 카드에서 말풍선으로 표시할 가상 응답 라인 */
  spokenLines?: string[];
}

export interface Scenario {
  userInput: string;
  actors: SimActor[];
  steps: SimStep[];
  /** 연속된 같은 parallelGroup 스텝을 묶은 2차원 배열. 단일 스텝도 [step]으로 통일. */
  groupedSteps: SimStep[][];
  primaryDiagram?: SpecMetaDiagram;
}

// 비개발자가 읽을 시간을 주도록 기본 스텝 지속 시간을 늘린다.
// rate 1x 기준. rate로 속도 조절 가능.
const DEFAULT_STEP_MS = 3200;
const DEFAULT_TOOL_MS = 2400;
const DEFAULT_DATA_MS = 2000;

/**
 * 스펙 메타데이터와 분석 결과로부터 결정적 시나리오를 빌드.
 * LLM 호출 없이 순수 함수로 동작한다.
 */
export interface BuildScenarioOptions {
  /** 사용자가 직접 지정한 입력. 빈 문자열이면 기본값으로 폴백. */
  userInputOverride?: string | null;
}

export function buildScenario(
  specMeta: SpecMeta | null,
  analysis: Analysis | null | undefined,
  opts?: BuildScenarioOptions,
): Scenario {
  const override = opts?.userInputOverride?.trim();
  const userInput = override && override.length > 0 ? override : pickUserInput(specMeta, analysis);
  const intent = inferIntent(userInput);

  const primaryDiagram = pickPrimaryFlowchart(specMeta);
  const actors: SimActor[] = [];
  const actorSet = new Set<string>();
  const addActor = (a: SimActor) => {
    if (!actorSet.has(a.id)) {
      actorSet.add(a.id);
      actors.push(a);
    }
  };

  // agent_prompts를 lowercase name → excerpt Map으로 1회 인덱싱하여
  // agent 스텝을 만들 때 선형 탐색을 피한다. 대형 system_prompt가 많을수록 효과 큼.
  const promptExcerptByName = new Map<string, string>();
  for (const p of specMeta?.agent_prompts ?? []) {
    const text = p.system_prompt || p.example_prompt;
    if (!text) continue;
    const excerpt = text.length > 260 ? text.slice(0, 260) + "…" : text;
    promptExcerptByName.set(p.agent_name.toLowerCase(), excerpt);
  }
  const lookupPrompt = (name: string) => promptExcerptByName.get(name.toLowerCase());

  addActor({ id: "__user__", label: "사용자", kind: "user" });

  // 에이전트 컴포넌트 (design_summary → agent_prompts 순위)
  const componentNames = specMeta?.design_summary?.agent_components?.map((c) => c.name).filter(Boolean) ?? [];
  const promptNames = specMeta?.agent_prompts?.map((p) => p.agent_name).filter(Boolean) ?? [];
  const agentNames = componentNames.length > 0 ? componentNames : promptNames;
  for (const name of agentNames) {
    addActor({ id: `agent:${name}`, label: name, kind: "agent" });
  }

  for (const tool of specMeta?.tools ?? []) {
    addActor({ id: `tool:${tool.name}`, label: tool.name, kind: "tool" });
  }

  for (const ds of specMeta?.data_integrations?.items ?? []) {
    addActor({
      id: `data:${ds.ds_id}`,
      label: ds.ds_name || ds.ds_id,
      kind: "data",
    });
  }

  addActor({ id: "__output__", label: "최종 산출물", kind: "output" });

  // 스텝 시퀀스 구성
  const steps: SimStep[] = [];
  let idx = 0;
  let group = 0;

  // 0. 사용자 입력
  steps.push({
    index: idx++,
    actorId: "__user__",
    kind: "user",
    summary: "사용자 요청",
    detail: userInput,
    durationMs: 800,
    parallelGroup: group++,
  });

  const architecture = specMeta?.design_summary?.architecture?.toLowerCase() ?? "";
  const isMultiAgent = architecture.includes("multi") && agentNames.length > 1;

  if (isMultiAgent) {
    // 첫 번째 에이전트가 조율자 역할로 진입
    const [first, ...rest] = agentNames;
    if (first) {
      steps.push({
        index: idx++,
        actorId: `agent:${first}`,
        kind: "agent",
        summary: `${first}: 요청 분석 및 작업 분배`,
        detail: `의도: ${intent}`,
        promptExcerpt: lookupPrompt(first),
        durationMs: DEFAULT_STEP_MS,
        parallelGroup: group++,
      });
    }
    // 나머지 에이전트는 같은 parallelGroup으로 병렬 실행
    if (rest.length > 0) {
      const parallelGroupForRest = group++;
      for (const name of rest) {
        steps.push({
          index: idx++,
          actorId: `agent:${name}`,
          kind: "agent",
          summary: `${name}: 병렬 실행`,
          detail: `의도: ${intent}`,
          promptExcerpt: lookupPrompt(name),
          durationMs: DEFAULT_STEP_MS,
          parallelGroup: parallelGroupForRest,
        });
      }
    }
  } else {
    // 단일 에이전트 또는 직렬 체인
    for (const name of agentNames) {
      steps.push({
        index: idx++,
        actorId: `agent:${name}`,
        kind: "agent",
        summary: `${name}: 작업 수행`,
        detail: `의도: ${intent}`,
        promptExcerpt: lookupPrompt(name),
        durationMs: DEFAULT_STEP_MS,
        parallelGroup: group++,
      });
    }
  }

  // 데이터 소스 호출
  for (const ds of specMeta?.data_integrations?.items ?? []) {
    const example = ds.example_queries?.[0];
    steps.push({
      index: idx++,
      actorId: `data:${ds.ds_id}`,
      kind: "data",
      summary: `데이터 조회: ${ds.ds_name || ds.ds_id}`,
      detail: ds.connection || undefined,
      dataCall: { ds_id: ds.ds_id, ds_name: ds.ds_name, example },
      durationMs: DEFAULT_DATA_MS,
      parallelGroup: group++,
    });
  }

  // 툴 호출
  for (const tool of specMeta?.tools ?? []) {
    steps.push({
      index: idx++,
      actorId: `tool:${tool.name}`,
      kind: "tool",
      summary: `도구 호출: ${tool.name}`,
      detail: tool.purpose,
      toolCall: { name: tool.name, signature: tool.signature, purpose: tool.purpose },
      durationMs: DEFAULT_TOOL_MS,
      parallelGroup: group++,
    });
  }

  // 최종 산출물
  const outputSummary = analysis?.output_types?.join(", ") || "산출물 생성";
  steps.push({
    index: idx++,
    actorId: "__output__",
    kind: "output",
    summary: `최종 산출물: ${outputSummary}`,
    durationMs: 800,
    parallelGroup: group++,
  });

  // 결정적 해시 기반 spokenLines 주입
  const seed = djb2(userInput);
  for (let i = 0; i < steps.length; i++) {
    steps[i].spokenLines = composeSpokenLines(steps[i], {
      seed,
      intent,
      nextStep: steps[i + 1],
      userInput,
    });
  }

  const groupedSteps = groupByParallel(steps);

  return { userInput, actors, steps, groupedSteps, primaryDiagram };
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function sampleN(seed: number, salt: number, min: number, max: number): number {
  const range = Math.max(1, max - min + 1);
  return min + ((seed ^ (salt * 2654435761)) >>> 0) % range;
}

interface ComposeCtx {
  seed: number;
  intent: string;
  nextStep?: SimStep;
  userInput: string;
}

function composeSpokenLines(step: SimStep, ctx: ComposeCtx): string[] {
  const { seed, intent, nextStep } = ctx;
  switch (step.kind) {
    case "user":
      return [`"${truncate(ctx.userInput, 90)}"`];
    case "agent": {
      const agentName = step.actorId.startsWith("agent:") ? step.actorId.slice(6) : "에이전트";
      const next = nextStep && nextStep.kind !== "output" ? describeNext(nextStep) : "결과를 정리합니다";
      return [
        `의도를 "${intent}"로 파악했습니다.`,
        `${next}.`,
      ].filter((l) => l.length > 0).map((l) => `[${agentName}] ${l}`);
    }
    case "tool": {
      const n = sampleN(seed, step.index + 11, 2, 24);
      const purpose = step.toolCall?.purpose?.trim();
      return [
        purpose ? `${truncate(purpose, 80)}` : "도구를 실행합니다.",
        `(예시 결과: ${n}건 반환)`,
      ];
    }
    case "data": {
      const rows = sampleN(seed, step.index + 37, 3, 120);
      const q = step.dataCall?.example?.trim();
      const lines: string[] = [];
      if (q) lines.push(`쿼리: ${truncate(q, 80)}`);
      lines.push(`(예시 결과: ${rows}행)`);
      return lines;
    }
    case "output":
      return ["최종 산출물을 사용자에게 전달합니다."];
    default:
      return [];
  }
}

function describeNext(next: SimStep): string {
  if (next.kind === "agent") {
    const n = next.actorId.startsWith("agent:") ? next.actorId.slice(6) : "다음 에이전트";
    return `${n}에게 작업을 넘깁니다`;
  }
  if (next.kind === "tool") {
    const n = next.actorId.startsWith("tool:") ? next.actorId.slice(5) : "도구";
    return `${n} 도구를 호출합니다`;
  }
  if (next.kind === "data") {
    const n = next.actorId.startsWith("data:") ? next.actorId.slice(5) : "데이터";
    return `${n}에서 데이터를 조회합니다`;
  }
  return "다음 단계로 진행합니다";
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n) + "…";
}

function groupByParallel(steps: SimStep[]): SimStep[][] {
  const groups: SimStep[][] = [];
  for (const step of steps) {
    const last = groups[groups.length - 1];
    if (last && last[0].parallelGroup === step.parallelGroup) {
      last.push(step);
    } else {
      groups.push([step]);
    }
  }
  return groups;
}

function pickUserInput(specMeta: SpecMeta | null, analysis: Analysis | null | undefined): string {
  const firstExample = specMeta?.data_integrations?.items
    ?.flatMap((it) => it.example_queries ?? [])
    .find((q) => typeof q === "string" && q.trim().length > 0);
  if (firstExample) return firstExample;

  const painPoint = analysis?.pain_point?.trim();
  if (painPoint) {
    const steps = analysis?.process_steps?.slice(0, 2).join(" → ");
    return steps ? `${painPoint} — ${steps}` : painPoint;
  }
  return "샘플 요청";
}

export interface InputPreset {
  id: string;
  label: string;
  text: string;
}

const FALLBACK_SAMPLE_INPUT = "샘플 요청 (직접 입력으로 바꿔보세요)";

export function collectInputPresets(
  specMeta: SpecMeta | null,
  analysis: Analysis | null | undefined,
): InputPreset[] {
  const seen = new Set<string>();
  const presets: InputPreset[] = [];
  const push = (label: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    presets.push({
      id: `p${presets.length}`,
      label: label.length > 18 ? label.slice(0, 18) + "…" : label,
      text: trimmed,
    });
  };

  for (const ds of specMeta?.data_integrations?.items ?? []) {
    for (const q of ds.example_queries ?? []) {
      if (typeof q === "string" && q.trim()) {
        const label = ds.ds_name ? `${ds.ds_name} 예시` : q.slice(0, 18);
        push(label, q);
        if (presets.length >= 4) break;
      }
    }
    if (presets.length >= 4) break;
  }

  if (presets.length < 4 && analysis?.pain_point?.trim()) {
    push("내 문제 상황", analysis.pain_point);
  }

  if (presets.length === 0) {
    push("기본 샘플", FALLBACK_SAMPLE_INPUT);
  }

  return presets;
}

const INTENT_RULES: { keywords: string[]; intent: string }[] = [
  { keywords: ["환불", "refund", "반품", "return"], intent: "환불·반품 처리" },
  { keywords: ["리뷰", "review", "평점", "rating"], intent: "리뷰 분석" },
  { keywords: ["재고", "inventory", "stock"], intent: "재고 확인" },
  { keywords: ["요약", "summarize", "summary"], intent: "요약 생성" },
  { keywords: ["조회", "lookup", "검색", "search", "find"], intent: "데이터 조회" },
  { keywords: ["분류", "classify", "categorize", "라벨"], intent: "분류" },
  { keywords: ["추천", "recommend", "suggest"], intent: "추천" },
  { keywords: ["결제", "payment", "billing", "청구"], intent: "결제·청구" },
  { keywords: ["일정", "schedule", "예약", "reserve"], intent: "일정·예약" },
];

export function inferIntent(text: string): string {
  const lower = text.toLowerCase();
  for (const rule of INTENT_RULES) {
    if (rule.keywords.some((k) => lower.includes(k.toLowerCase()))) return rule.intent;
  }
  return "일반 요청 처리";
}

function pickPrimaryFlowchart(specMeta: SpecMeta | null): SpecMetaDiagram | undefined {
  const diagrams = specMeta?.diagrams ?? [];
  return (
    diagrams.find((d) => d.kind === "flowchart" && (d.parsed_nodes?.length ?? 0) > 0) ??
    diagrams.find((d) => d.kind === "flowchart") ??
    diagrams[0]
  );
}

