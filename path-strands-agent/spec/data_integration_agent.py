"""Tier 3: 선택된 데이터 소스별 통합 설계 JSON을 생성하는 Agent.

Assembler가 이 JSON을 '데이터 통합 설계' markdown 섹션으로 렌더한다.
선택된 DS가 0건이면 LLM 호출 없이 빈 bundle을 반환한다.
"""

import logging
from typing import Any, Dict, List, Optional

from agent_config import get_profile
from llm_parsing import extract_json
from prompts import render_selected_data_sources_xml
from schemas import DataIntegrationsBundle
from spec._helpers import build_analysis_context, extract_final_text
from strands_utils import create_spec_agent
from token_tracker import extract_usage

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """당신은 AI Agent 시스템의 데이터 통합(Data Integration) 설계 전문가입니다.

## 역할
- 선택된 각 데이터 소스(DS)에 대해 구현 수준의 통합 설계를 구조화된 JSON으로 산출
- 명세서의 '데이터 통합 설계' 섹션으로 렌더되므로 실무자가 바로 착수 가능한 구체성 필요

## 필드 정의 (각 DS 1건당 아래 모든 필드를 채울 것)
- connection: 어떤 라이브러리/SDK/프로토콜로 연결할지. 예: "asyncpg via AWS RDS IAM auth", "boto3 S3 client"
- auth_flow: 인증·자격증명 획득 플로우. secret_ready=true면 Secrets Manager 기반, false면 OAuth/수동
- error_policy: 재시도·서킷브레이커·타임아웃 전략. latency=realtime vs batch 특성 반영
- idempotency: 동일 요청 반복 시 처리. read-only면 "해당 없음", write면 트랜잭션/멱등 키 명시
- pii_handling: tags에 "pii"가 있거나 민감정보 가능성이 있으면 구체 처리안, 없으면 "해당 없음"
- example_queries: 실제로 이 Agent가 던질 예시 쿼리/호출 2-4개 (최소 1개)

## 금지
- 플레이스홀더("TBD", "예정") 사용 금지 — 구체 값을 채울 것
- 선택되지 않은 DS를 items에 포함 금지
- JSON 이외의 텍스트 출력 금지
"""


class DataIntegrationAgent:
    """선택된 데이터 소스별 통합 설계 JSON 생성."""

    def __init__(self):
        cfg = get_profile("tool")
        self.agent = create_spec_agent(
            _SYSTEM_PROMPT,
            model_id=cfg["model_id"],
            max_tokens=cfg["max_tokens"],
            temperature=cfg.get("temperature"),
        )
        self._last_usage: Dict[str, Any] = {}

    def generate(
        self,
        analysis: Dict[str, Any],
        selected_data_sources: Optional[List[dict]] = None,
    ) -> Dict[str, Any]:
        """DataIntegrationsBundle dict 반환. 선택된 DS가 없으면 빈 items."""
        items = selected_data_sources or []
        if not items:
            self._last_usage = {}
            return {"items": []}

        ds_xml = render_selected_data_sources_xml(items)
        context_section = build_analysis_context(analysis)

        id_list = ", ".join(str(it.get("id", "")) for it in items if isinstance(it, dict))

        prompt = f"""{context_section}

{ds_xml}

<instructions>
위 `<selected_data_sources>` 블록의 모든 DS 각각에 대해 아래 스키마의 JSON을 출력하세요.

**반드시 선택된 DS 개수({len(items)}개)와 items 배열 길이가 일치해야 합니다.**
**사용 가능한 ds_id 집합**: {id_list}

```json
{{
  "items": [
    {{
      "ds_id": "ds_...",
      "ds_name": "DS 이름",
      "connection": "...",
      "auth_flow": "...",
      "error_policy": "...",
      "idempotency": "...",
      "pii_handling": "...",
      "example_queries": ["...", "..."]
    }}
  ]
}}
```

JSON만 출력하세요.
</instructions>"""

        try:
            result = self.agent(prompt)
            response_text = extract_final_text(result)
            parsed = extract_json(response_text, "data integration")
            # Pydantic 검증 (실패 시 빈 bundle fallback)
            bundle = DataIntegrationsBundle.model_validate(parsed)
            self._last_usage = extract_usage(result)
            return bundle.model_dump()
        except Exception as e:
            logger.warning(
                "[DataIntegrationAgent] 실패 — 빈 bundle로 fallback: %s: %s",
                type(e).__name__,
                str(e)[:200],
            )
            self._last_usage = {}
            return {"items": []}
