---
name: prompt-engineering
description: Agent System Prompt 작성 가이드. 역할 정의, 지시 사항, 출력 형식 등 효과적인 프롬프트 작성 방법.
license: Apache-2.0
metadata:
  version: "1.0"
  author: path-team
---

# Prompt Engineering for Agents

AI Agent의 System Prompt를 효과적으로 작성하는 가이드입니다.

## System Prompt 구조

| 섹션 | 내용 | 필수 |
|------|------|------|
| **Role** | Agent의 역할 정의 | O |
| **Context** | 작업 배경 설명 | O |
| **Task** | 수행할 작업 | O |
| **Constraints** | 제약 조건 | - |
| **Output Format** | 출력 형식 | - |
| **Examples** | 예시 (Few-shot) | - |

## 기본 템플릿

```
당신은 [역할]입니다.

## 배경
[작업 배경 및 목적]

## 작업
다음을 수행하세요:
1. [단계 1]
2. [단계 2]
3. [단계 3]

## 제약 조건
- [제약 1]
- [제약 2]

## 출력 형식
[예상 출력 형식]
```

## 역할별 템플릿

| 역할 | 핵심 요소 | Reference |
|------|----------|-----------|
| **Classifier** | 카테고리, 분류 기준 | `role-templates.md` |
| **Analyzer** | 분석 관점, 인사이트 추출 | `role-templates.md` |
| **Generator** | 생성 조건, 품질 기준 | `role-templates.md` |
| **Reviewer** | 평가 기준, 피드백 형식 | `role-templates.md` |
| **Coordinator** | 팀 구성, 작업 분배 | `role-templates.md` |

## 출력 형식 가이드

| 형식 | 용도 | Reference |
|------|------|-----------|
| **JSON** | 구조화된 데이터 | `output-formats.md` |
| **Markdown** | 문서, 보고서 | `output-formats.md` |
| **Table** | 비교, 목록 | `output-formats.md` |
| **Step-by-step** | 추론 과정 | `output-formats.md` |

## Quick Examples

### Classifier Agent
```
당신은 고객 문의 분류 전문가입니다.

다음 카테고리 중 하나로 분류하세요:
- 배송 문의
- 결제 문의
- 제품 문의
- 교환/반품
- 기타

분류 결과를 JSON으로 반환하세요:
{"category": "...", "confidence": 0.0-1.0, "reason": "..."}
```

### Analyzer Agent
```
당신은 데이터 분석 전문가입니다.

다음 관점에서 분석하세요:
1. 핵심 트렌드
2. 이상 징후
3. 개선 기회

핵심 인사이트 3-5개를 도출하세요.
```

### Generator Agent
```
당신은 마케팅 카피라이터입니다.

다음 조건으로 광고 문구를 작성하세요:
- 타겟: 20-30대 직장인
- 톤앤매너: 친근하고 위트 있게
- 길이: 50자 이내
- 포함 키워드: [제품명]
```

## Available References

상세 가이드가 필요하면 `skill_tool`로 로드:

- `role-templates.md` - 역할별 상세 템플릿
- `output-formats.md` - 출력 형식 예시
- `chain-prompts.md` - Multi-turn 프롬프트 설계
- `few-shot-examples.md` - Few-shot 프롬프팅 가이드

**사용 예시:**
```
skill_tool(skill_name="prompt-engineering", reference="role-templates.md")
```

## Best Practices

1. **명확한 역할 정의**: "당신은 X입니다"로 시작
2. **구체적인 지시**: 모호함 제거, 단계별 안내
3. **제약 조건 명시**: 하지 말아야 할 것도 명확히
4. **출력 형식 지정**: 예시와 함께 형식 안내
5. **테스트 및 반복**: 다양한 입력으로 테스트 후 개선
