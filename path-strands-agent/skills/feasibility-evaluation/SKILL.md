---
name: feasibility-evaluation
description: AI Agent 아이디어의 실현 가능성을 평가하고 취약 항목에 대한 개선안을 제시하는 가이드
license: Apache-2.0
metadata:
  version: "1.0"
  author: path-team
---

# Feasibility Evaluation Guide

AI Agent 아이디어의 실현 가능성을 5개 항목으로 평가하고, 취약점에 대한 개선안을 제시합니다.

## 평가 항목 요약

| 항목 | 기준 | 최고점 | Reference |
|------|------|--------|-----------|
| **데이터 접근성** | 데이터 소스의 접근 용이성 | 10점 | `scoring-criteria.md` |
| **판단 명확성** | 의사결정 규칙의 명확도 | 10점 | `scoring-criteria.md` |
| **오류 허용도** | 실패 시 리스크 수준 | 10점 | `scoring-criteria.md` |
| **지연 요구사항** | 응답 시간 제약 | 10점 | `scoring-criteria.md` |
| **통합 복잡도** | 외부 시스템 연동 난이도 | 10점 | `scoring-criteria.md` |

## 판정 기준

| 총점 | 판정 | 설명 |
|------|------|------|
| 40-50점 | ✅ 즉시 진행 | 프로토타입 시작 권장 |
| 30-39점 | ⚠️ 조건부 진행 | 취약 항목 개선 후 진행 |
| 20-29점 | 🔄 재평가 필요 | 상당한 개선 필요 |
| 20점 미만 | ❌ 대안 모색 | 현재 상태로는 구현 어려움 |

## 취약 항목 기준

**7점 이하**인 항목은 취약 항목으로 분류됩니다.

취약 항목에 대해서는:
1. 현재 상태 진단
2. 구체적인 개선 제안
3. 개선 시 예상 점수 향상

## 평가 프로세스

```
1. 초기 입력 분석
   - Pain Point, INPUT, PROCESS, OUTPUT 검토
   - 통합 정보 (API, MCP, 데이터소스) 확인

2. 5개 항목 평가
   - 각 항목별 점수 산정
   - 점수 근거 제시
   - 취약 항목 식별

3. 개선 제안
   - 취약 항목별 현재 상태 진단
   - 구체적인 개선 방법 제시
   - 예상 효과 설명

4. 재평가 (사용자 개선안 반영)
   - 사용자의 개선 계획 검토
   - 점수 재산정
   - 최종 권고
```

## Available References

상세 가이드가 필요하면 `skill_tool`로 로드:

- `scoring-criteria.md` - 5개 항목별 세부 점수 기준
- `improvement-suggestions.md` - 항목별 개선 제안 템플릿
- `risk-patterns.md` - 일반적인 리스크 패턴 및 대응 방안

**사용 예시:**
```
skill_tool(skill_name="feasibility-evaluation", reference="scoring-criteria.md")
```

## Best Practices

1. **객관적 평가**: 낙관적 해석 금지, 현실적 점수 산정
2. **근거 제시**: 모든 점수에 구체적 근거 명시
3. **실행 가능한 개선안**: 추상적이 아닌 구체적 액션 아이템
4. **우선순위**: 가장 취약한 항목부터 개선 권장
5. **재평가 유연성**: 사용자 개선안 반영 시 합리적 점수 조정
