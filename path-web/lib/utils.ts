export function formatKST(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(/\. /g, "-").replace(".", "");
}

/** 3계층 패턴 파싱 결과 */
export interface ParsedLayers {
  layer1: string[];
  layer2: string[];
  layer3: string[];
}

/**
 * "Layer1(RAG + Tool-based) + Layer2(ReAct + Reflection) + Layer3(Workflow)"
 * 형태의 패턴 문자열을 3계층으로 파싱.
 * 파싱 실패 시 null 반환 (기존 단일 문자열 표시로 fallback).
 */
export function parsePatternLayers(pattern: string | undefined | null): ParsedLayers | null {
  if (!pattern) return null;
  const clean = pattern.replace(/^3계층\s*조합\s*:\s*/i, "").trim();
  const layerRegex = /Layer\s*(\d)\s*[:(（]\s*([^)）]+)[)）]/gi;
  const result: ParsedLayers = { layer1: [], layer2: [], layer3: [] };
  let matched = false;

  let m;
  while ((m = layerRegex.exec(clean)) !== null) {
    matched = true;
    const items = m[2].split(/\s*[+,]\s*/).map((s) => s.trim()).filter(Boolean);
    if (m[1] === "1") result.layer1 = items;
    else if (m[1] === "2") result.layer2 = items;
    else if (m[1] === "3") result.layer3 = items;
  }

  return matched ? result : null;
}
