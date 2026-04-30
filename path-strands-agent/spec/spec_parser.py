"""서브 에이전트 결과 마크다운을 구조화 데이터로 파싱.

결정적 regex 기반 파서. 실패하면 빈 값 또는 원본 유지로 graceful degrade.
orchestrator에서 spec_meta SSE 이벤트로 프론트에 전달하기 위한 모듈.
"""

import re
from typing import Dict, Any, List, Optional

from spec._helpers import parse_agent_names


def extract_mermaid_diagrams(md: str) -> List[Dict[str, Any]]:
    """마크다운에서 mermaid 코드블록과 직전 헤딩(###)을 추출.

    각 블록에 대해 flowchart/graph는 노드·엣지를 1차 파싱. sequenceDiagram은 파싱하지
    않고 원본만 보관한다. 파싱 실패 시 parsed_nodes=[]/parsed_edges=[]로 둔다.
    """
    results: List[Dict[str, Any]] = []
    pattern = re.compile(r"```mermaid\s*\n(.*?)```", re.DOTALL)
    for match in pattern.finditer(md):
        source = match.group(1).strip()
        start = match.start()
        title = _find_preceding_heading(md, start)
        kind = _detect_mermaid_kind(source)
        nodes: List[Dict[str, str]] = []
        edges: List[Dict[str, str]] = []
        if kind in ("flowchart", "graph"):
            try:
                nodes, edges = _parse_flowchart(source)
            except Exception:
                nodes, edges = [], []
        results.append({
            "title": title,
            "kind": kind,
            "mermaid_source": source,
            "parsed_nodes": nodes,
            "parsed_edges": edges,
        })
    return results


def extract_agent_prompts(md: str) -> List[Dict[str, str]]:
    """'### 4.N AgentName' 섹션에서 System/Example Prompt 코드블록을 추출."""
    results: List[Dict[str, str]] = []
    heading_re = re.compile(r"^###\s+4\.\d+\s+(.+?)\s*$", re.MULTILINE)
    matches = list(heading_re.finditer(md))
    for i, m in enumerate(matches):
        name = m.group(1).strip()
        section_start = m.end()
        section_end = matches[i + 1].start() if i + 1 < len(matches) else _next_heading_at_or_above(md, section_start, 3)
        section = md[section_start:section_end]

        system_prompt = _extract_labeled_codeblock(section, r"System\s*Prompt")
        example_prompt = _extract_labeled_codeblock(section, r"Example\s*User\s*Prompt")

        results.append({
            "agent_name": name,
            "system_prompt": system_prompt or "",
            "example_prompt": example_prompt or "",
        })
    return results


def extract_tools(md: str) -> List[Dict[str, str]]:
    """'### 5.N tool_name' 섹션에서 Purpose/Signature/When to use bullet을 추출."""
    results: List[Dict[str, str]] = []
    heading_re = re.compile(r"^###\s+5\.\d+\s+(.+?)\s*$", re.MULTILINE)
    matches = list(heading_re.finditer(md))
    for i, m in enumerate(matches):
        name = m.group(1).strip().strip("`[]")
        section_start = m.end()
        section_end = matches[i + 1].start() if i + 1 < len(matches) else _next_heading_at_or_above(md, section_start, 3)
        section = md[section_start:section_end]

        results.append({
            "name": name,
            "purpose": _extract_bullet(section, "Purpose") or "",
            "signature": _extract_bullet(section, "Signature") or "",
            "when_to_use": _extract_bullet(section, "When to use") or "",
        })
    return results


def extract_design_summary(md: str) -> Dict[str, Any]:
    """2.1 Pattern Selection + 2.2 Agent Components에서 요약 정보 추출."""
    pattern = ""
    architecture = ""

    sel = _extract_subsection(md, r"2\.1")
    if sel:
        # 첫 번째 비어있지 않은 라인에서 패턴명 후보 추출
        for line in sel.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            m = re.match(r"[-*]?\s*\*{0,2}(Pattern|패턴)\*{0,2}\s*[:：]\s*(.+)", line, re.IGNORECASE)
            if m:
                pattern = m.group(2).strip().strip("`*")
                break
        if not pattern:
            text = re.sub(r"[*_`]", "", sel).strip()
            first_line = next((ln.strip() for ln in text.splitlines() if ln.strip() and not ln.strip().startswith("#")), "")
            pattern = first_line[:120]
        m_arch = re.search(r"(single-agent|multi-agent)", sel, re.IGNORECASE)
        if m_arch:
            architecture = m_arch.group(1).lower()

    agent_components = _parse_agent_components_table(md)

    return {
        "pattern": pattern,
        "architecture": architecture,
        "agent_components": agent_components,
        # 에이전트 이름 목록 (fallback 용)
        "agent_names": parse_agent_names(md) if "2.2" in md else [ac.get("name", "") for ac in agent_components],
    }


# --------------------------- internal helpers ---------------------------


def _find_preceding_heading(md: str, before_offset: int) -> str:
    """주어진 오프셋 앞에서 가장 가까운 `###` 헤딩 텍스트 반환."""
    prefix = md[:before_offset]
    matches = list(re.finditer(r"^###\s+(.+)$", prefix, re.MULTILINE))
    if not matches:
        return ""
    return matches[-1].group(1).strip()


def _detect_mermaid_kind(source: str) -> str:
    first = source.lstrip().split("\n", 1)[0].strip().lower()
    if first.startswith("flowchart"):
        return "flowchart"
    if first.startswith("graph"):
        return "graph"
    if first.startswith("sequencediagram"):
        return "sequenceDiagram"
    return "unknown"


def _parse_flowchart(source: str) -> tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    """flowchart/graph 블록에서 노드와 엣지를 파싱.

    지원 엣지: `-->`, `---`, `-.->`, `==>`, `--|label|-->`, `-->|label|`.
    """
    nodes: Dict[str, Dict[str, str]] = {}
    edges: List[Dict[str, str]] = []

    # 첫 줄(방향 선언) 제외
    lines = source.strip().split("\n")[1:]

    # 노드 참조: id 또는 id[label]/id(label)/id{label}/id((label))/... (id만 캡처)
    node_ref_re = (
        r"([A-Za-z_][\w]*)"
        r"(?:\[\[[^\]]+\]\]|\[/[^/]+/\]|\[\\[^\\]+\\\]|\(\([^)]+\)\)|\{\{[^}]+\}\}|\[[^\]]+\]|\([^)]+\)|\{[^}]+\}|>[^\]]+\])?"
    )
    node_decl_re = re.compile(
        r"(?P<id>[A-Za-z_][\w]*)"
        r"(?:"
        r"\[\[(?P<l1>[^\]]+)\]\]"
        r"|\[/(?P<l2>[^/]+)/\]"
        r"|\[\\(?P<l3>[^\\]+)\\\]"
        r"|\(\((?P<l4>[^)]+)\)\)"
        r"|\{\{(?P<l5>[^}]+)\}\}"
        r"|\[(?P<l6>[^\]]+)\]"
        r"|\((?P<l7>[^)]+)\)"
        r"|\{(?P<l8>[^}]+)\}"
        r")"
    )

    for raw in lines:
        line = raw.strip()
        if not line or line.startswith("%%") or line.startswith("subgraph") or line == "end":
            continue
        if line.startswith("classDef") or line.startswith("class ") or line.startswith("linkStyle") or line.startswith("style "):
            continue

        # 노드 선언 추출
        for m in node_decl_re.finditer(line):
            node_id = m.group("id")
            label = next((m.group(g) for g in ("l1", "l2", "l3", "l4", "l5", "l6", "l7", "l8") if m.group(g)), node_id)
            label = label.strip().strip('"')
            if node_id not in nodes or nodes[node_id]["label"] == node_id:
                nodes[node_id] = {"id": node_id, "label": label}

        # 엣지 추출 — 노드가 괄호 라벨을 동반해도 매칭 가능
        edge_re = re.compile(
            rf"{node_ref_re}\s*"
            r"(?:-{2,3}>|-{2,3}|-\.->|={2,3}>)"
            r"(?:\s*\|([^|]*)\|)?"
            rf"\s*{node_ref_re}"
        )
        for em in edge_re.finditer(line):
            src = em.group(1)
            label = (em.group(2) or "").strip()
            dst = em.group(3)
            # 노드 참조만으로 등장한 id는 id=label로 등록
            for nid in (src, dst):
                if nid not in nodes:
                    nodes[nid] = {"id": nid, "label": nid}
            edges.append({"source": src, "target": dst, "label": label})

    return list(nodes.values()), edges


def _extract_labeled_codeblock(section: str, label_regex: str) -> Optional[str]:
    """`**Label:**` 또는 `**Label**:` 직후의 첫 번째 코드블록 내용을 반환."""
    m = re.search(
        rf"\*\*{label_regex}\s*:?\s*\*\*\s*:?\s*\n+```[^\n]*\n(.*?)```",
        section,
        re.DOTALL | re.IGNORECASE,
    )
    if m:
        return m.group(1).strip()
    return None


def _extract_bullet(section: str, label: str) -> Optional[str]:
    """`- **Label**: value` 형태의 한 줄 bullet 값을 반환."""
    m = re.search(
        rf"^\s*[-*]\s*\*\*{re.escape(label)}\*\*\s*:?\s*(.+?)\s*$",
        section,
        re.MULTILINE | re.IGNORECASE,
    )
    if m:
        return m.group(1).strip().strip("`")
    return None


def _extract_subsection(md: str, section_prefix_regex: str) -> str:
    """'#+ 2.1 ...' 같은 서브섹션의 내용을 다음 같은 레벨 헤딩 전까지 반환."""
    m = re.search(rf"(#+)\s+{section_prefix_regex}\s", md)
    if not m:
        return ""
    level = len(m.group(1))
    start = m.end()
    next_heading = re.search(rf"\n#{{1,{level}}}\s+\d", md[start:])
    return md[start:start + next_heading.start()] if next_heading else md[start:]


def _next_heading_at_or_above(md: str, start: int, level: int) -> int:
    """start 이후에서 레벨 <= level 인 다음 헤딩 위치 반환. 없으면 len(md)."""
    m = re.search(rf"\n(#{{1,{level}}})\s+", md[start:])
    if not m:
        return len(md)
    return start + m.start()


def _parse_agent_components_table(md: str) -> List[Dict[str, str]]:
    """'### 2.2 Agent Components' 테이블을 에이전트 행 리스트로 파싱."""
    section = _extract_subsection(md, r"2\.2")
    if not section:
        return []
    rows = re.findall(r"^\s*\|(.+)\|\s*$", section, re.MULTILINE)
    if len(rows) < 3:
        return []
    header_cols = [c.strip() for c in rows[0].split("|")]
    components: List[Dict[str, str]] = []
    for row in rows[2:]:  # header + separator 스킵
        cols = [c.strip() for c in row.split("|")]
        if not cols or not cols[0] or re.match(r"^[-:]+$", cols[0]):
            continue
        entry: Dict[str, str] = {"name": cols[0]}
        for i, col_name in enumerate(header_cols):
            if i == 0 or i >= len(cols):
                continue
            key = re.sub(r"[^a-z0-9]+", "_", col_name.lower()).strip("_")
            if key:
                entry[key] = cols[i]
        components.append(entry)
    return components
