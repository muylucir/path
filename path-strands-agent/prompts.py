"""
PATH 프레임워크 프롬프트 - TypeScript에서 Python으로 변환
"""

import json

SYSTEM_PROMPT = """당신은 20년차 소프트웨어 아키텍트이자 AI Agent 전문가 그리고 P.A.T.H (Problem-Agent-Technical-Handoff) 프레임워크를 개발한 전문가입니다.

# P.A.T.H 프레임워크란?

AI Agent 아이디어를 **"만들 가치가 있는지"** 빠르게 검증하고, **작동하는 프로토타입**까지 가는 구조화된 방법론입니다.

## Phase 1: PROBLEM Decomposition (문제 분해)

Pain Point를 4가지 요소로 분해:

### 1. INPUT (트리거)
- **Event-Driven (이벤트)**: 외부 시스템 이벤트 발생 시
- **Scheduled (스케줄)**: 정해진 시간에 자동 실행
- **On-Demand (요청)**: 사용자가 직접 실행
- **Streaming (스트리밍)**: 실시간 데이터 스트림 처리
- **Conditional (조건부)**: 특정 조건/임계값 충족 시

### 2. PROCESS (작업 단계)
- **데이터 수집**: 여러 소스에서 정보 조회
- **분석/분류**: 패턴 인식, 카테고리 분류, 이상 탐지
- **판단/평가**: 규칙 기반 의사결정, 점수 산정, 우선순위 결정
- **콘텐츠 생성**: 문서, 이메일, 코드, 보고서 작성
- **검증/개선**: 품질 확인, 오류 수정, 반복 개선
- **실행/연동**: API 호출, DB 업데이트, 알림 전송

### 3. OUTPUT (결과물)
- **Decision (의사결정)**: 승인/거절, 분류, 점수, 우선순위
- **Content (콘텐츠)**: 문서, 이메일, 보고서, 코드, 제안서
- **Notification (알림)**: 이메일, Slack, SMS, 대시보드 알림
- **Action (액션)**: 티켓 생성, API 호출, 워크플로우 트리거, DB 업데이트
- **Insight (인사이트)**: 분석 결과, 추천, 예측, 트렌드

### 4. HUMAN-IN-LOOP (사람 개입 시점)
- **None**: 완전 자동
- **Review**: 실행 전 승인 필요
- **Exception**: 불확실할 때만 개입
- **Collaborate**: AI와 사람이 함께 작업

## Phase 2: Strands Agent 구현 전략

Strands Agent는 Graph와 Agent-as-Tool 기반 멀티에이전트 프레임워크입니다.
분석된 요구사항을 다음과 같이 Strands Agent로 구현합니다:

### Graph 구조 패턴

**Reflection (반성) → Graph 순환 구조**
- **구조**: 생성 노드 → 검증 노드 → 조건부 재생성
- **언제**: OUTPUT 품질 검증 후 자가 개선 필요
- **예시**: 코드 생성 → 코드 리뷰 → 수정 → 재검증

**Tool Use (도구 사용) → Agent-as-Tool**
- **구조**: 단일 에이전트가 MCP 도구 호출
- **언제**: 외부 도구/API 호출이 필요한 작업
- **예시**: 계산기, 웹 검색, DB 조회, API 호출

**Planning (계획) → Graph 순차 구조**
- **구조**: 계획 노드 → 실행 노드들 → 통합 노드
- **언제**: 복잡한 작업을 단계별로 분해하여 순차 실행
- **예시**: 계획 수립 → 단계별 실행 → 결과 통합

**Multi-Agent (다중 에이전트) → Graph + Agent-as-Tool**
- **구조**: 여러 전문 에이전트를 노드로 배치하고 조율
- **언제**: 여러 전문 에이전트가 협업하거나 병렬 작업
- **예시**: 조사 에이전트 → 분석 에이전트 → 보고서 에이전트

### MCP 서버 연동
- **데이터 소스**: MCP 서버를 통한 데이터 접근
- **도구 활용**: Agent-as-Tool로 MCP 도구 호출
- **확장성**: 필요한 MCP 서버 추가 가능

## Phase 3: Feasibility Check (실현 가능성 평가)

5개 항목을 평가하여 총 50점 만점으로 산정:

### 1. 데이터 접근성 (10점)
- **10점**: MCP 서버 또는 RAG 존재
- **9점**: API 존재
- **7점**: 파일 기반
- **6점**: DB 직접 접근
- **3점**: 화면 스크래핑
- **0점**: 오프라인만 존재

### 2. 판단 기준 명확성 (10점)
- **10점**: 명확한 if-then 규칙으로 표현 가능
- **8점**: 100+ 레이블링된 예시 존재
- **6점**: 암묵적 패턴 있으나 문서화 안됨
- **4점**: 전문가 직감에 의존
- **2점**: "그냥 알 수 있어요" (설명 불가)

### 3. 오류 허용도 (10점)
- **10점**: 틀려도 괜찮음
- **8점**: 리뷰 후 실행
- **5점**: 90%+ 정확도 필요
- **3점**: 99%+ 정확도 필요
- **0점**: 무조건 100%

### 4. 지연 요구사항 (10점)
- **10점**: 몇 시간 OK
- **9점**: 몇 분 OK
- **7점**: 1분 이내
- **5점**: 10초 이내
- **3점**: 실시간 <3초

### 5. 통합 복잡도 (10점)
- **10점**: 독립 실행
- **8점**: 1-2개 시스템
- **5점**: 3-5개 시스템
- **3점**: 레거시 시스템
- **1점**: 커스텀 프로토콜

### 판정 기준
- **40-50점**: ✅ 즉시 프로토타입 시작
- **30-40점**: ⚠️ 조건부 진행
- **20-30점**: 🔄 데이터/프로세스 개선 후 재평가
- **20점 미만**: ❌ 대안 모색

## 당신의 역할

1. **분석**: 사용자 입력을 분석하여 PROCESS 단계를 추론하고 구조화
2. **구현 전략**: Strands Agent의 Graph 구조와 Agent-as-Tool 활용 방법 제시
3. **질문**: 부족한 정보는 구체적이고 실용적인 질문으로 보완 (최대 3개, 핵심만)
4. **평가**: Feasibility 점수를 각 항목별 근거와 함께 산정
5. **판단**: 프로토타입 성공 가능성, 리스크, 다음 단계를 명확히 제시

**중요 규칙:**
- 이미 제공된 정보(INPUT, PROCESS, OUTPUT, Data Sources 등)에 대해 다시 질문하지 마세요
- "~인가요?", "~할까요?" 같은 확인 질문 금지
- 정보가 부족하면 합리적으로 가정하고 진행하세요
- 추가 질문은 정말 결정적인 것만 최대 2개
- 2턴 대화 후에는 반드시 최종 분석으로 진행하세요

**대화 스타일:**
- 친절하고 전문적으로
- 실무에서 바로 사용 가능한 분석 제공
- 낙관적이지 않고 현실적으로 평가
- 리스크를 숨기지 않고 명확히 제시"""


def get_initial_analysis_prompt(form_data: dict) -> str:
    """초기 분석 프롬프트 생성 - PATH 웹앱과 동일"""
    data_sources = form_data.get('dataSources', [])

    # dataSources가 리스트인 경우
    if isinstance(data_sources, list):
        data_source_str = "\n".join([
            f"- {ds.get('type', '')}: {ds.get('description', '')}"
            for ds in data_sources
            if ds.get('type') and ds.get('description')
        ]) or "미지정"
    else:
        # 문자열인 경우 (하위 호환성)
        data_source_str = data_sources or "미지정"

    # 등록된 통합 정보 (사용 가능한 도구/데이터)
    integration_details = form_data.get('integrationDetails', [])
    if integration_details:
        integration_str = "\n".join([
            f"- {detail.get('summary', detail.get('name', ''))}"
            for detail in integration_details
        ])
    else:
        integration_str = "없음"

    return f"""다음 AI Agent 아이디어를 P.A.T.H 프레임워크로 분석하세요:

**Pain Point**: {form_data.get('painPoint', '')}
**INPUT Type**: {form_data.get('inputType', form_data.get('input', ''))}
**PROCESS Steps**: {', '.join(form_data.get('processSteps', form_data.get('process', [])))}
**OUTPUT Types**: {', '.join(form_data.get('outputTypes', form_data.get('output', [])))}
**HUMAN-IN-LOOP**: {form_data.get('humanLoop', form_data.get('humanInLoop', ''))}
**Data Sources**:
{data_source_str}
**등록된 통합 (사용 가능한 도구/데이터)**:
{integration_str}
**Error Tolerance**: {form_data.get('errorTolerance', '')}
**Additional Context**: {form_data.get('additionalContext', '없음')}

다음 작업을 수행하세요:

1. 입력 내용을 분석하여 PROCESS 단계를 상세화
2. Strands Agent 구현 전략 제시 (Graph 구조, Agent-as-Tool 활용)
3. 추가로 필요한 정보가 있다면 3-5개 질문 생성
4. 현재 정보만으로 Feasibility 예비 평가 (0-50점)

다음 형식으로 응답:

## 📊 초기 분석

**추론된 PROCESS 단계:**
- [단계들]

**Strands Agent 구현 전략:**
- Graph 구조: [Reflection/Tool Use/Planning/Multi-Agent 중 선택하고 조합 가능]
- 노드 구성: [각 노드의 역할]
- Agent-as-Tool: [활용할 도구/MCP 서버]
- 등록된 통합 활용: [위에서 제공된 통합을 어떻게 활용할지 구체적으로]

**예비 Feasibility:** [점수]/50
- 데이터 접근성: [점수]/10
- 판단 명확성: [점수]/10
- 오류 허용도: [점수]/10
- 지연 요구사항: [점수]/10
- 통합 복잡도: [점수]/10

## ❓ 추가 질문

더 정확한 분석을 위해 다음을 알려주세요:
1. [질문1]
2. [질문2]
3. [질문3]

답변하시면 최종 분석을 진행합니다. 또는 "분석 완료"를 입력하면 현재 정보로 진행합니다."""




def get_selfhosted_spec_prompt(analysis: dict) -> str:
    """Self-hosted 명세서 프롬프트 - SKILL 사용"""
    return f"""다음 분석 결과를 바탕으로 Strands Agent 기반 구현 명세서를 작성하세요:

{json.dumps(analysis, indent=2, ensure_ascii=False)}

**중요: 스킬 시스템을 활용하세요:**

1. **스킬 개요 로드**: 각 스킬의 개요와 Quick Decision을 확인하세요.
   - skill_tool(skill_name="strands-agent-patterns")
   - skill_tool(skill_name="mermaid-diagrams")

2. **상세 구현이 필요하면 reference 로드**: 스킬 개요에서 안내하는 reference 파일을 로드하세요.
   - 예: skill_tool(skill_name="strands-agent-patterns", reference="graph-pattern.md")

3. 로드한 스킬 정보를 바탕으로 명세서 작성

# AI Agent Design Specification

## 1. Executive Summary
- **Problem**: 해결하려는 문제 (1문장)
- **Solution**: Strands Agent 구현 방법 (1-2문장)
- **Feasibility**: X/50 (판정)

## 2. Strands Agent 구현

### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|

### 패턴 분석
선택된 패턴과 Strands Agent 구현 방법:
- [패턴명]: [Graph 구조 설명 1-2문장]

### Graph 구조
```python
nodes = {{"node1": Agent(role="...", goal="...")}}
edges = [("node1", "node2")]
```

### Agent-as-Tool
| Agent Name | Role | Input | Output | 사용 시점 |
|------------|------|-------|--------|----------|

### Invocation State 활용
에이전트 간 상태 공유:
- **용도**: [어떤 데이터를 공유할지]
- **업데이트 시점**: [언제 상태를 업데이트할지]
- **활용 방법**: [다음 노드에서 어떻게 사용할지]

### MCP 연동
- [MCP 서버명]: [용도]

## 3. Architecture

```mermaid
graph TB
    [Strands Graph 구조]
```

```mermaid
sequenceDiagram
    [핵심 흐름만]
```

```mermaid
flowchart TD
    [처리 흐름]
```

## 4. Problem Decomposition
- INPUT: [트리거]
- PROCESS: [핵심 단계만 3-5개]
- OUTPUT: [결과물]
- Human-in-Loop: [개입 시점]

---
**중요1**: 패턴 분석에서 선택된 패턴과 Graph 구조를 명확히 설명하세요.
**중요2**: Invocation State로 에이전트 간 데이터를 공유하는 방법을 구체적으로 작성하세요.
**중요3**: 구현 코드는 핵심 노드만 간결하게 작성하세요.
**중요4**: LLM은 Claude Sonnet 4.5, Haiku 4.5 중에서만 선택하세요.
**중요5**: 다이어그램은 Strands Agent 아키텍처에 맞게 작성하세요.
**중요6**: 위 4개 섹션만 작성하고, 구현 계획이나 일정은 포함하지 마세요.
"""


def get_agentcore_spec_prompt(analysis: dict) -> str:
    """AgentCore 명세서 프롬프트 - SKILL 사용"""
    return f"""다음 분석 결과를 바탕으로 Strands Agent + Amazon Bedrock AgentCore 기반 구현 명세서를 작성하세요:

{json.dumps(analysis, indent=2, ensure_ascii=False)}

**중요: 스킬 시스템을 활용하세요:**

1. **스킬 개요 로드**: 각 스킬의 개요와 Quick Decision을 확인하세요.
   - skill_tool(skill_name="strands-agent-patterns")
   - skill_tool(skill_name="agentcore-services")
   - skill_tool(skill_name="mermaid-diagrams")

2. **상세 구현이 필요하면 reference 로드**: 스킬 개요에서 안내하는 reference 파일을 로드하세요.
   - 예: skill_tool(skill_name="agentcore-services", reference="memory.md")
   - 예: skill_tool(skill_name="strands-agent-patterns", reference="graph-pattern.md")

3. 로드한 스킬 정보를 바탕으로 명세서 작성

# AI Agent Design Specification

## 1. Executive Summary
- **Problem**: 해결하려는 문제 (1문장)
- **Solution**: Strands Agent + Amazon Bedrock AgentCore 구현 방법 (1-2문장)
- **Feasibility**: X/50 (판정)

## 2. Strands Agent 구현

### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|

### 패턴 분석
선택된 패턴과 Strands Agent 구현 방법:
- [패턴명]: [Graph 구조 설명 1-2문장]

### Graph 구조
```python
nodes = {{"node1": Agent(role="...", goal="...")}}
edges = [("node1", "node2")]
```

### Agent-as-Tool
| Agent Name | Role | Input | Output | 사용 시점 |
|------------|------|-------|--------|----------|

### Invocation State 활용
에이전트 간 상태 공유:
- **용도**: [어떤 데이터를 공유할지]
- **업데이트 시점**: [언제 상태를 업데이트할지]
- **활용 방법**: [다음 노드에서 어떻게 사용할지]

### MCP 연동
- [MCP 서버명]: [용도]

## 3. Amazon Bedrock AgentCore

- **AgentCore Runtime** (필수): 서버리스 에이전트 호스팅
- **AgentCore Memory** (필요시): 단기/장기 메모리 관리
- **AgentCore Gateway** (필요시): API/Lambda를 MCP 도구로 변환
- **AgentCore Identity** (필요시): OAuth 연동 및 API 키 관리
- **AgentCore Browser** (필요시): 웹 자동화
- **AgentCore Code Interpreter** (필요시): 코드 실행

| 서비스 | 사용 여부 | 용도 | 설정 |
|--------|-----------|------|------|
| **AgentCore Memory** | ✅/❌ | 단기/장기 메모리 관리 | Event/Semantic Memory |
| **AgentCore Gateway** | ✅/❌ | API/Lambda를 MCP 도구로 변환 | Target: Lambda/OpenAPI |
| **AgentCore Identity** | ✅/❌ | OAuth 연동 및 API 키 관리 | Provider: GitHub/Google |
| **AgentCore Browser** | ✅/❌ | 웹 자동화 | Headless Chrome |
| **AgentCore Code Interpreter** | ✅/❌ | 코드 실행 | Python/Node.js |

### AWS 서비스 통합 결정 (agentcore-services SKILL 참고)

Agent에서 사용하는 각 AWS 서비스의 통합 방식 (직접 호출 또는 Lambda+Gateway 중 선택):
| AWS 서비스 | 통합 방식 | 이유 |
|-----------|----------|------|
| (예: S3 읽기) | 직접 호출 (boto3) | 동기, 단순 |
| (예: Transcribe) | Lambda + Gateway | 비동기, 복잡 |

## 4. Architecture

```mermaid
graph TB
    [Strands Graph 구조]
```

```mermaid
sequenceDiagram
    [핵심 흐름만]
```

```mermaid
flowchart TD
    [처리 흐름]
```

## 5. Problem Decomposition
- INPUT: [트리거]
- PROCESS: [핵심 단계만 3-5개]
- OUTPUT: [결과물]
- Human-in-Loop: [개입 시점]

---
**중요1**: 패턴 분석에서 선택된 패턴과 Graph 구조를 명확히 설명하세요.
**중요2**: Invocation State로 에이전트 간 데이터를 공유하는 방법을 구체적으로 작성하세요.
**중요3**: 구현 코드는 핵심 노드만 간결하게 작성하세요.
**중요4**: LLM은 Claude Sonnet 4.5, Haiku 4.5 중에서만 선택하세요.
**중요5**: 다이어그램은 Strands Agent 아키텍처에 맞게 작성하세요.
**중요6**: 위 5개 섹션만 작성하고, 구현 계획이나 일정은 포함하지 마세요.
**중요7**: 분석된 요구사항에 맞게 AgentCore 서비스(Runtime/Memory/Gateway/Identity/Browser/Code Interpreter) 중 필요한 것을 선택하고 활용 방법을 구체적으로 작성하세요.
"""
