"""
Spec Parser - Markdown 명세서를 JSON Canvas State로 변환

명세서의 Agent Components 테이블, Graph 구조, AgentCore 서비스 구성을
파싱하여 프론트엔드 캔버스에서 사용할 수 있는 JSON 형식으로 변환합니다.
"""

import re
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class AgentNode:
    id: str
    name: str
    role: str
    systemPrompt: str
    input: str
    output: str
    llm: Dict[str, Any]
    tools: List[str]


@dataclass
class RouterNode:
    id: str
    name: str
    condition: str
    branches: List[Dict[str, str]]


@dataclass
class CanvasEdge:
    id: str
    source: str
    target: str
    label: Optional[str] = None


@dataclass
class AgentCanvasState:
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    entryPoint: str
    agentCoreConfig: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class SpecParser:
    """Markdown 명세서를 JSON으로 변환하는 파서"""

    def __init__(self):
        self.node_positions = {}
        self.position_counter = 0

    def parse(self, spec_markdown: str, analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        명세서 파싱 메인 함수

        Args:
            spec_markdown: Markdown 형식의 명세서
            analysis: 원본 분석 데이터 (선택적)

        Returns:
            AgentCanvasState 형식의 딕셔너리
        """
        nodes = []
        edges = []

        # 1. Agent Components 테이블 파싱
        agent_nodes = self._parse_agent_table(spec_markdown)
        nodes.extend(agent_nodes)

        # 2. Graph 구조 파싱 (edges)
        parsed_edges = self._parse_graph_structure(spec_markdown, agent_nodes)
        edges.extend(parsed_edges)

        # 3. AgentCore 서비스 테이블 파싱
        agentcore_config = self._parse_agentcore_table(spec_markdown)

        # 4. AgentCore 서비스 노드 생성 (Memory, Gateway, Identity)
        if agentcore_config:
            service_nodes, service_edges = self._create_agentcore_nodes(
                agentcore_config, agent_nodes
            )
            nodes.extend(service_nodes)
            edges.extend(service_edges)

        # 5. Entry point 결정 (Agent 노드만 대상으로)
        entry_point = self._determine_entry_point(agent_nodes, parsed_edges)

        # 6. 메타데이터 생성
        pattern = self._extract_pattern(spec_markdown, analysis)
        metadata = {
            "pattern": pattern,
            "version": "1.0.0",
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
        }

        return {
            "nodes": nodes,
            "edges": edges,
            "entryPoint": entry_point,
            "agentCoreConfig": agentcore_config,
            "metadata": metadata,
        }

    def _parse_agent_table(self, spec: str) -> List[Dict[str, Any]]:
        """Agent Components 테이블 파싱"""
        nodes = []

        # Agent Components 테이블 찾기
        table_pattern = r"### Agent Components\s*\n\|[^\n]+\|\s*\n\|[-\s|]+\|\s*\n((?:\|[^\n]+\|\s*\n)+)"
        match = re.search(table_pattern, spec)

        if not match:
            return nodes

        table_rows = match.group(1).strip().split("\n")

        for idx, row in enumerate(table_rows):
            cells = [cell.strip() for cell in row.split("|")[1:-1]]
            if len(cells) >= 6:
                name, role, input_val, output_val, llm, tools = cells[:6]

                # LLM 모델 파싱
                llm_model = "claude-sonnet-4.5"
                if "haiku" in llm.lower():
                    llm_model = "claude-haiku-4.5"

                # Tools 파싱
                tools_list = [t.strip() for t in tools.split(",") if t.strip()]

                node_id = f"agent-{idx + 1}"
                position = self._get_next_position()

                nodes.append({
                    "id": node_id,
                    "type": "agent",
                    "position": position,
                    "data": {
                        "id": node_id,
                        "name": name,
                        "role": role,
                        "systemPrompt": "",
                        "input": input_val,
                        "output": output_val,
                        "llm": {"model": llm_model},
                        "tools": tools_list,
                    },
                })

                self.node_positions[name.lower()] = node_id

        return nodes

    def _parse_graph_structure(self, spec: str, nodes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Graph 구조에서 edges 파싱"""
        edges = []

        # Python 코드 블록에서 edges 찾기
        code_pattern = r"```python\s*([\s\S]*?)```"
        code_matches = re.findall(code_pattern, spec)

        for code_block in code_matches:
            # edges 리스트 파싱
            edges_pattern = r'edges\s*=\s*\[([\s\S]*?)\]'
            edges_match = re.search(edges_pattern, code_block)

            if edges_match:
                edges_str = edges_match.group(1)
                # 튜플 파싱: ("node1", "node2") 또는 ('node1', 'node2')
                tuple_pattern = r'\(\s*["\']([^"\']+)["\']\s*,\s*["\']([^"\']+)["\']\s*\)'
                tuples = re.findall(tuple_pattern, edges_str)

                for idx, (source, target) in enumerate(tuples):
                    source_id = self._find_node_id(source, nodes)
                    target_id = self._find_node_id(target, nodes)

                    if source_id and target_id:
                        edges.append({
                            "id": f"e{idx + 1}",
                            "source": source_id,
                            "target": target_id,
                        })

        # edges가 없으면 순차적으로 연결
        if not edges and len(nodes) > 1:
            for idx in range(len(nodes) - 1):
                edges.append({
                    "id": f"e{idx + 1}",
                    "source": nodes[idx]["id"],
                    "target": nodes[idx + 1]["id"],
                })

        return edges

    def _parse_agentcore_table(self, spec: str) -> Optional[Dict[str, Any]]:
        """AgentCore 서비스 구성 테이블 파싱"""

        # AgentCore 섹션이 없으면 None 반환
        if "AgentCore" not in spec:
            return None

        config = {
            "runtime": {"enabled": True, "timeout": 900, "concurrency": 1000},
            "memory": {"enabled": False, "strategies": []},
            "gateway": {"enabled": False, "targets": []},
            "identity": {"enabled": False, "providers": []},
            "browser": {"enabled": False},
            "codeInterpreter": {"enabled": False},
        }

        # 서비스 테이블 찾기
        table_pattern = r"\| 서비스 \|[^\n]+\|\s*\n\|[-\s|]+\|\s*\n((?:\|[^\n]+\|\s*\n)+)"
        match = re.search(table_pattern, spec)

        if match:
            rows = match.group(1).strip().split("\n")
            for row in rows:
                cells = [cell.strip() for cell in row.split("|")[1:-1]]
                if len(cells) >= 2:
                    service = cells[0].lower()
                    enabled = "✅" in cells[1] if len(cells) > 1 else False

                    if "memory" in service:
                        config["memory"]["enabled"] = enabled
                        # 전략 파싱
                        if enabled and len(cells) > 3:
                            strategies_text = cells[3]
                            if "semantic" in strategies_text.lower():
                                config["memory"]["strategies"].append("semantic")
                            if "preference" in strategies_text.lower():
                                config["memory"]["strategies"].append("user-preference")
                            if "summary" in strategies_text.lower():
                                config["memory"]["strategies"].append("summary")
                            if "episodic" in strategies_text.lower():
                                config["memory"]["strategies"].append("episodic")

                    elif "gateway" in service:
                        config["gateway"]["enabled"] = enabled

                    elif "identity" in service:
                        config["identity"]["enabled"] = enabled

                    elif "browser" in service:
                        config["browser"]["enabled"] = enabled

                    elif "code interpreter" in service:
                        config["codeInterpreter"]["enabled"] = enabled

        return config

    def _create_agentcore_nodes(
        self,
        agentcore_config: Dict[str, Any],
        agent_nodes: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        AgentCore 서비스 설정에서 Memory/Gateway/Identity 노드 생성

        Args:
            agentcore_config: AgentCore 서비스 설정
            agent_nodes: 파싱된 Agent 노드 목록

        Returns:
            (service_nodes, service_edges) 튜플
        """
        nodes = []
        edges = []

        # 서비스 노드 위치: Agent 흐름 우측에 배치
        # Agent 노드들의 최대 x 위치를 기준으로 오프셋
        max_agent_x = max((n.get("position", {}).get("x", 0) for n in agent_nodes), default=0)
        service_x = max_agent_x + 300  # Agent 영역 우측에 충분한 간격
        service_y_start = 50
        service_spacing = 180
        current_y = service_y_start

        # Agent ID 목록
        agent_ids = [node["id"] for node in agent_nodes if node.get("type") == "agent"]

        # Memory 노드 생성
        if agentcore_config.get("memory", {}).get("enabled"):
            memory_config = agentcore_config["memory"]
            strategies = memory_config.get("strategies", [])

            # Memory 타입 결정: 전략이 있으면 long-term
            memory_type = "long-term" if strategies else "short-term"

            memory_node = {
                "id": "memory-1",
                "type": "memory",
                "position": {"x": service_x, "y": current_y},
                "data": {
                    "id": "memory-1",
                    "name": "AgentCore Memory",
                    "type": memory_type,
                    "strategies": strategies,
                    "namespaces": [],
                }
            }
            nodes.append(memory_node)

            # 모든 Agent → Memory 연결 (service 타입 edge)
            for idx, agent_id in enumerate(agent_ids):
                edges.append({
                    "id": f"e-mem-{idx + 1}",
                    "source": agent_id,
                    "target": "memory-1",
                    "label": "memory",
                    "type": "service",
                })

            current_y += service_spacing

        # Gateway 노드 생성
        if agentcore_config.get("gateway", {}).get("enabled"):
            gateway_config = agentcore_config["gateway"]
            targets = gateway_config.get("targets", [])

            # targets를 적절한 형식으로 변환
            target_list = []
            for target in targets:
                if isinstance(target, str):
                    target_list.append({
                        "type": "mcp-server",
                        "name": target,
                        "config": {}
                    })
                elif isinstance(target, dict):
                    target_list.append(target)

            gateway_node = {
                "id": "gateway-1",
                "type": "gateway",
                "position": {"x": service_x, "y": current_y},
                "data": {
                    "id": "gateway-1",
                    "name": "AgentCore Gateway",
                    "targets": target_list,
                }
            }
            nodes.append(gateway_node)

            # 모든 Agent → Gateway 연결
            for idx, agent_id in enumerate(agent_ids):
                edges.append({
                    "id": f"e-gw-{idx + 1}",
                    "source": agent_id,
                    "target": "gateway-1",
                    "label": "tools",
                    "type": "service",
                })

            current_y += service_spacing

        # Identity 노드 생성
        if agentcore_config.get("identity", {}).get("enabled"):
            identity_config = agentcore_config["identity"]
            providers = identity_config.get("providers", [])

            identity_node = {
                "id": "identity-1",
                "type": "identity",
                "position": {"x": service_x, "y": current_y},
                "data": {
                    "id": "identity-1",
                    "name": "AgentCore Identity",
                    "authType": "oauth2-2lo",
                    "provider": providers[0] if providers else "",
                    "scopes": [],
                }
            }
            nodes.append(identity_node)

            # Identity는 Gateway에 연결 (OAuth로 API 인증)
            if agentcore_config.get("gateway", {}).get("enabled"):
                edges.append({
                    "id": "e-id-gw",
                    "source": "identity-1",
                    "target": "gateway-1",
                    "label": "auth",
                    "type": "service",
                })

            current_y += service_spacing

        return nodes, edges

    def _find_node_id(self, name: str, nodes: List[Dict[str, Any]]) -> Optional[str]:
        """노드 이름으로 ID 찾기"""
        name_lower = name.lower()

        # 직접 매칭
        if name_lower in self.node_positions:
            return self.node_positions[name_lower]

        # 부분 매칭
        for node in nodes:
            node_name = node["data"]["name"].lower()
            if name_lower in node_name or node_name in name_lower:
                return node["id"]

        return None

    def _determine_entry_point(self, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> str:
        """Entry point 결정 - 들어오는 edge가 없는 노드"""
        if not nodes:
            return ""

        target_ids = {edge["target"] for edge in edges}
        for node in nodes:
            if node["id"] not in target_ids:
                return node["id"]

        return nodes[0]["id"]

    def _extract_pattern(self, spec: str, analysis: Dict[str, Any] = None) -> str:
        """패턴 이름 추출"""
        if analysis and "pattern" in analysis:
            return analysis["pattern"]

        # 명세서에서 패턴 찾기
        pattern_match = re.search(r"패턴[:\s]+([^\n,]+)", spec)
        if pattern_match:
            return pattern_match.group(1).strip()

        return "Graph Pattern"

    def _get_next_position(self) -> Dict[str, int]:
        """다음 노드 위치 계산"""
        row = self.position_counter // 3
        col = self.position_counter % 3

        position = {
            "x": 100 + col * 250,
            "y": 50 + row * 200,
        }

        self.position_counter += 1
        return position


def parse_spec_to_canvas(spec_markdown: str, analysis: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    편의 함수: 명세서를 캔버스 상태로 변환

    Args:
        spec_markdown: Markdown 형식의 명세서
        analysis: 원본 분석 데이터 (선택적)

    Returns:
        AgentCanvasState 형식의 딕셔너리
    """
    parser = SpecParser()
    return parser.parse(spec_markdown, analysis)


if __name__ == "__main__":
    # 테스트용 샘플 명세서 (AgentCore 포함)
    sample_spec = """
# AI Agent Design Specification

## 2. Strands Agent 구현

### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|
| Coordinator | 요청 분석 및 라우팅 | 사용자 요청 | 라우팅 결정 | Claude Sonnet 4.5 | route_to_agent |
| Analyzer | 데이터 분석 | 분석 요청 | 분석 결과 | Claude Sonnet 4.5 | data_query, chart_generate |
| Generator | 콘텐츠 생성 | 생성 요청 | 생성된 콘텐츠 | Claude Haiku 4.5 | text_generate |

### Graph 구조
```python
nodes = {"coordinator": Agent(...), "analyzer": Agent(...), "generator": Agent(...)}
edges = [("coordinator", "analyzer"), ("coordinator", "generator")]
```

## 3. Amazon Bedrock AgentCore

| 서비스 | 사용 여부 | 용도 | 설정 |
|--------|-----------|------|------|
| **AgentCore Runtime** | ✅ | 전체 Multi-Agent 호스팅 | 3개 Agent를 1개 Runtime에서 호스팅 |
| **AgentCore Memory** | ✅ | 대화 기록 및 사용자 선호 저장 | Long-term Memory (semantic, user-preference) |
| **AgentCore Gateway** | ✅ | 외부 API 도구 연동 | Lambda/OpenAPI |
| **AgentCore Identity** | ✅ | OAuth 인증 | Google OAuth |
| **AgentCore Browser** | ❌ | - | - |
| **AgentCore Code Interpreter** | ❌ | - | - |
    """

    result = parse_spec_to_canvas(sample_spec)
    print(json.dumps(result, indent=2, ensure_ascii=False))

    # 노드 수 확인
    agent_nodes = [n for n in result["nodes"] if n["type"] == "agent"]
    service_nodes = [n for n in result["nodes"] if n["type"] in ("memory", "gateway", "identity")]
    print(f"\n=== Summary ===")
    print(f"Agent nodes: {len(agent_nodes)}")
    print(f"Service nodes: {len(service_nodes)} (Memory, Gateway, Identity)")
    print(f"Total edges: {len(result['edges'])}")
