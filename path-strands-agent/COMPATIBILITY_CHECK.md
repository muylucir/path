# PATH 웹앱 vs Strands Agent 호환성 체크리스트

## ✅ 1. /api/bedrock/analyze (초기 분석)

### PATH 웹앱 요구사항
**입력:** formData (painPoint, inputType, processSteps, outputTypes, humanLoop, dataSources, errorTolerance, additionalContext)
**출력:** 스트리밍 텍스트

### Strands Agent 구현
- ✅ AnalyzerAgent.analyze_stream()
- ✅ 동일한 입력 형식
- ✅ 스트리밍 출력
- ✅ get_initial_analysis_prompt() 사용 (PATH 웹앱과 동일)

**상태:** ✅ **완전 호환**

---

## ✅ 2. /api/bedrock/chat (대화)

### PATH 웹앱 요구사항
**입력:** {conversation, userMessage}
**출력:** 스트리밍 텍스트
**프롬프트:**
```
{conversationText}

USER: {userMessage}

사용자의 답변을 반영하여:
1. 추가 정보가 더 필요하면 구체적으로 질문 (최대 3개)
2. 충분하면 "이제 최종 분석을 진행할 수 있습니다. '분석 완료'를 입력하세요." 안내

자연스럽게 대화하세요.
```

### Strands Agent 구현
- ✅ ChatAgent.chat_stream()
- ✅ 대화 히스토리 관리
- ✅ 스트리밍 출력
- ✅ **프롬프트 동일** (확인 완료)

**상태:** ✅ **완전 호환**

---

## ⚠️ 3. /api/bedrock/finalize (최종 평가)

### PATH 웹앱 요구사항
**입력:** {formData, conversation}
**출력:** JSON
```json
{
  "pain_point": string,
  "input_type": string,
  "input_detail": string,
  "process_steps": string[],
  "output_types": string[],
  "output_detail": string,
  "human_loop": string,
  "pattern": string,
  "pattern_reason": string,
  "feasibility_breakdown": {
    "data_access": number,
    "decision_clarity": number,
    "error_tolerance": number,
    "latency": number,
    "integration": number
  },
  "feasibility_score": number,
  "recommendation": string,
  "risks": string[],
  "next_steps": string[]
}
```

### Strands Agent 구현
- ✅ EvaluatorAgent.evaluate()
- ✅ 방금 수정: PATH 웹앱 JSON 형식 사용
- ❓ **모든 필드 생성 확인 필요**
- ❓ **테스트 필요**

**상태:** ⚠️ **테스트 필요**

---

## ❌ 4. /api/bedrock/spec (명세서 생성)

### PATH 웹앱 요구사항
**입력:** {analysis, useAgentCore}
**출력:** 스트리밍 마크다운

**Self-hosted 프롬프트:** 4개 섹션
**AgentCore 프롬프트:** 5개 섹션 (AgentCore 서비스 추가)

### Strands Agent 구현
- ✅ SpecAgent.generate_spec_stream()
- ✅ useAgentCore 분기
- ✅ 스트리밍 출력
- ❌ **프롬프트 간소화됨** - 원본 프롬프트 복원 필요

**상태:** ❌ **프롬프트 불일치**

---

## 🎯 수정 필요 사항

### 우선순위 1: SpecAgent 프롬프트 복원
- 현재: 간소화된 프롬프트
- 필요: PATH 웹앱의 전체 프롬프트 (중요1~7 규칙 포함)

### 우선순위 2: EvaluatorAgent 테스트
- 모든 필드가 제대로 생성되는지 확인
- 특히: process_steps, output_types, risks, next_steps

### 우선순위 3: 통합 테스트
- Step1 → Step2 → Step3 전체 플로우 테스트

