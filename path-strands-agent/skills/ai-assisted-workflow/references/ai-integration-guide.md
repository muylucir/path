# AI 통합 포인트 설계 가이드

파이프라인 내에서 AI(LLM)를 효과적으로 활용하기 위한 설계 가이드입니다.

## LLM Call Spec 정의

각 AI 호출 지점은 다음 항목을 명확히 정의해야 합니다:

### 1. 호출 목적 (Purpose)
- 이 단계에서 AI가 수행할 구체적인 태스크
- 예: "고객 문의를 {환불, 배송, 기술지원, 기타} 중 하나로 분류"

### 2. 입력 스키마 (Input Schema)
```json
{
  "context": "이전 단계에서 전달되는 데이터",
  "task_data": "AI가 처리할 핵심 데이터",
  "metadata": "부가 정보 (선택)"
}
```

### 3. 출력 스키마 (Output Schema)
```json
{
  "result": "AI 처리 결과",
  "confidence": 0.95,
  "reasoning": "판단 근거 (선택)"
}
```
- Structured Output (JSON mode) 권장
- 스키마 검증을 통한 출력 보장

### 4. 폴백 전략 (Fallback)
- AI 호출 실패 시: 재시도 → 기본값 → 사람 에스컬레이션
- 낮은 confidence 시: 사람 검토 큐로 전달
- 타임아웃 설정: 30초 기본, 복잡한 생성은 60초

## 모델 선택 가이드

| 태스크 유형 | 추천 모델 | 이유 |
|-----------|----------|------|
| 간단한 분류/추출 | Claude Haiku | 빠르고 저렴, 구조화된 태스크에 충분 |
| 복잡한 분석/판단 | Claude Sonnet | 성능과 비용의 균형 |
| 고품질 생성/요약 | Claude Sonnet | 창의적 생성에 적합 |
| 극도로 복잡한 추론 | Claude Opus | 최고 품질, 비용 높음 |

**비용 최적화 전략:**
- 분류/추출 단계: Haiku 사용 (비용 1/10)
- 생성/요약 단계: Sonnet 사용
- 파이프라인 내 여러 AI 단계가 있으면 단계별 모델을 다르게 선택

## 프롬프트 설계 (파이프라인 내)

파이프라인 내 AI 프롬프트는 에이전트 프롬프트와 다릅니다:

### 원칙
1. **단일 태스크**: 하나의 프롬프트에 하나의 명확한 태스크
2. **구조화된 출력**: JSON 출력 스키마를 프롬프트에 명시
3. **예시 포함**: Few-shot 예시로 출력 품질 보장
4. **제약 조건 명시**: 허용되는 값, 길이 제한 등

### 템플릿

```
당신은 [역할]입니다.

## 태스크
[구체적인 태스크 설명]

## 입력
{input_data}

## 출력 형식
다음 JSON 형식으로만 응답하세요:
{output_schema}

## 규칙
- [규칙 1]
- [규칙 2]

## 예시
입력: [예시 입력]
출력: [예시 출력]
```

### 안티패턴
- "적절히 판단하세요" → 명확한 기준 제시
- "자유롭게 작성하세요" → 구조와 제약 조건 명시
- 여러 태스크를 하나의 프롬프트에 → 태스크 분리

## 입출력 포맷 설계

### JSON Structured Output (권장)

```python
# Bedrock Converse API + Structured Output
response = client.converse(
    modelId="anthropic.claude-haiku-4-5-20251001-v1:0",
    messages=[{"role": "user", "content": [{"text": prompt}]}],
    inferenceConfig={"maxTokens": 1024},
)
```

### 검증 레이어

각 AI 출력 후 검증 단계를 추가:

```python
def validate_ai_output(output: dict, schema: dict) -> bool:
    """AI 출력이 예상 스키마와 일치하는지 검증"""
    # 필수 필드 존재 확인
    # 값 범위 확인
    # 타입 확인
    # 실패 시 재시도 또는 폴백
```

## 구현 예시: AWS Step Functions + Bedrock

```
Step Functions State Machine:
  1. [Lambda] 입력 전처리 (데이터 정규화)
  2. [Bedrock] AI 분류 (Claude Haiku)
  3. [Choice] 분류 결과에 따른 분기
     - 카테고리 A → [Lambda] A 처리
     - 카테고리 B → [Lambda] B 처리
     - 불확실 → [SNS] 사람에게 알림
  4. [Bedrock] AI 요약/생성 (Claude Sonnet)
  5. [Lambda] 결과 저장 + 알림
```

**장점:**
- 각 단계의 입출력이 명확하게 추적 가능
- 실패 시 자동 재시도 및 에러 핸들링
- 비용 예측 가능 (고정 호출 수)
- Step Functions 콘솔에서 시각적 모니터링
