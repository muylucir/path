/**
 * agentcore-client의 `enrichPayload` 훅에서 쓰는 공용 enrichment.
 *
 * body에 `formData.selectedDataSourceIds`(또는 평평하게 `selectedDataSourceIds`)가
 * 있으면 DynamoDB에서 resolve해 구조화된 형태 + 한 줄 요약을 덧붙인다.
 * 실패는 비치명적 — 원본 body를 그대로 반환한다.
 *
 * 백엔드(path-strands-agent)는 structured 배열을 XML 블록으로 serialize해
 * 각 agent 프롬프트에 1급 입력으로 주입한다. compact 문자열은 표시/fallback 용도.
 */

import { getDataSourcesByIds } from "@/lib/aws/data-sources";
import {
  compactDataSourceEntry,
  toStructuredEntry,
  type StructuredDataSourceEntry,
} from "@/lib/data-source-catalog";

const MAX_IDS = 30;

function extractIds(body: Record<string, unknown>): string[] {
  const fromFormData = (body.formData as Record<string, unknown> | undefined)
    ?.selectedDataSourceIds;
  const raw = fromFormData ?? body.selectedDataSourceIds;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .slice(0, MAX_IDS);
}

export async function enrichDataSources(
  body: Record<string, unknown>,
  _opts: { step: string },
): Promise<Record<string, unknown>> {
  try {
    const ids = extractIds(body);
    const stored = ids.length > 0 ? await getDataSourcesByIds(ids) : [];
    const structured: StructuredDataSourceEntry[] = stored.map((s) =>
      toStructuredEntry(s.entry),
    );
    const compact = stored.map((s) => compactDataSourceEntry(s.entry));
    return {
      ...body,
      selectedDataSources: structured,
      selectedDataSourcesCompact: compact,
    };
  } catch (err) {
    console.warn("[ds-enrichment] failed (non-fatal):", err);
    return body;
  }
}
