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
}

export interface Scenario {
  userInput: string;
  actors: SimActor[];
  steps: SimStep[];
  primaryDiagram?: SpecMetaDiagram;
}

const DEFAULT_STEP_MS = 1400;
const DEFAULT_TOOL_MS = 1100;
const DEFAULT_DATA_MS = 900;

/**
 * 스펙 메타데이터와 분석 결과로부터 결정적 시나리오를 빌드.
 * LLM 호출 없이 순수 함수로 동작한다.
 */
export function buildScenario(
  specMeta: SpecMeta | null,
  analysis: Analysis | null | undefined,
): Scenario {
  const userInput = pickUserInput(specMeta, analysis);

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

  return { userInput, actors, steps, primaryDiagram };
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

function pickPrimaryFlowchart(specMeta: SpecMeta | null): SpecMetaDiagram | undefined {
  const diagrams = specMeta?.diagrams ?? [];
  return (
    diagrams.find((d) => d.kind === "flowchart" && (d.parsed_nodes?.length ?? 0) > 0) ??
    diagrams.find((d) => d.kind === "flowchart") ??
    diagrams[0]
  );
}

