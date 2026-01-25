# AgentCore Observability

## 개념

AgentCore Observability는 에이전트 워크플로우의 **트레이싱, 디버깅, 성능 모니터링**을 제공하는 완전 관리형 서비스입니다.

**핵심 기능:**
- 에이전트 워크플로우 각 단계의 상세 시각화
- CloudWatch 대시보드를 통한 실시간 운영 성능 가시성
- 세션 수, 지연 시간, 토큰 사용량, 에러율 등 핵심 메트릭
- OpenTelemetry(OTEL) 호환 형식

**모니터링 대상:**
| 항목 | 설명 |
|------|------|
| **에이전트 호출** | 요청/응답, 지연 시간, 성공/실패 |
| **LLM 호출** | 모델 호출, 토큰 사용량, 응답 시간 |
| **도구 호출** | 도구별 호출 횟수, 실행 시간, 오류율 |
| **메모리 작업** | STM/LTM 읽기/쓰기, 검색 성능 |

## Prerequisites

### 1. CloudWatch Transaction Search 활성화

CloudWatch Application Signals에서 **Transaction Search**를 활성화해야 트레이스가 기록됩니다.

**AWS Console:**
1. CloudWatch 콘솔 → Application Signals → Transaction Search
2. "Enable Transaction Search" 클릭
3. 첫 활성화 시 몇 분 소요

**AWS CLI:**
```bash
aws cloudwatch enable-insight-rules \
  --rule-names "TransactionSearch"
```

### 2. requirements.txt 패키지 추가

```txt
aws-opentelemetry-distro>=0.7.0
strands-agents[otel]>=0.1.0
```

## Runtime 호스팅 에이전트 (자동 계측)

AgentCore Runtime에서 호스팅되는 에이전트는 **자동으로 OTEL 계측**됩니다.

**자동 수집되는 데이터:**
- 요청/응답 트레이스
- LLM 호출 스팬 (모델, 토큰, 지연 시간)
- 도구 호출 스팬 (도구명, 인자, 결과)
- 에러 및 예외 정보

**로그 위치:**
```
/aws/bedrock-agentcore/runtimes/{agent_id}/
```

**별도 설정 불필요** - Runtime에 배포하면 자동으로 활성화됩니다.

## 비-Runtime 에이전트 (수동 계측)

AgentCore Runtime 외부에서 실행되는 에이전트는 **수동 설정**이 필요합니다.

### 환경 변수 설정

```bash
export OTEL_SERVICE_NAME=my-agent
export OTEL_EXPORTER_OTLP_ENDPOINT=https://xray.us-west-2.amazonaws.com
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export AWS_REGION=us-west-2
```

### 자동 계측 실행

```bash
# opentelemetry-instrument로 실행
opentelemetry-instrument python agent.py
```

### 코드 내 수동 계측

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

# TracerProvider 설정
provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

# Tracer 생성
tracer = trace.get_tracer(__name__)

# 커스텀 스팬 생성
with tracer.start_as_current_span("my-custom-operation") as span:
    span.set_attribute("custom.key", "value")
    # 작업 수행
    result = do_work()
    span.set_attribute("result.status", "success")
```

### Strands Agent OTEL 통합

```python
from strands import Agent
from strands.telemetry.otel import OTelTracer

# OTEL Tracer로 Agent 생성
agent = Agent(
    model="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    tracer=OTelTracer()
)

# 에이전트 호출 시 자동으로 트레이스 생성
result = agent("데이터를 분석해줘")
```

## CloudWatch에서 확인

### GenAI Observability 대시보드

CloudWatch 콘솔에서 **GenAI Observability** 대시보드를 통해 에이전트 메트릭을 확인합니다.

**제공 뷰:**
| 뷰 | 설명 |
|-----|------|
| **Agents** | 에이전트별 호출 횟수, 성공률, 평균 지연 시간 |
| **Sessions** | 세션별 대화 흐름, 토큰 사용량 |
| **Traces** | 개별 요청의 상세 트레이스 |
| **Metrics** | 집계된 성능 메트릭 (P50, P90, P99) |

**접근 경로:**
```
CloudWatch → Application Signals → GenAI Observability
```

### 트레이스 검색

```
CloudWatch → X-Ray → Transaction Search → /aws/spans/default
```

**검색 예시:**
```sql
# 특정 에이전트의 오류 트레이스
filter @serviceName = "my-agent" and @status = "ERROR"

# 지연 시간이 긴 요청
filter @duration > 5000

# 특정 도구 호출 트레이스
filter @toolName = "search_database"
```

### 로그 그룹 확인

```bash
# Runtime 로그
aws logs tail /aws/bedrock-agentcore/runtimes/{agent_id}/ --follow

# 에이전트 실행 로그
aws logs filter-log-events \
  --log-group-name /aws/bedrock-agentcore/runtimes/{agent_id}/ \
  --filter-pattern "ERROR"
```

## 주요 메트릭

### 에이전트 메트릭

| 메트릭 | 설명 | 단위 |
|--------|------|------|
| `AgentInvocations` | 에이전트 호출 횟수 | Count |
| `AgentLatency` | 에이전트 응답 시간 | Milliseconds |
| `AgentErrors` | 에이전트 오류 횟수 | Count |
| `AgentSuccessRate` | 에이전트 성공률 | Percent |

### LLM 메트릭

| 메트릭 | 설명 | 단위 |
|--------|------|------|
| `LLMInvocations` | LLM 호출 횟수 | Count |
| `InputTokens` | 입력 토큰 수 | Count |
| `OutputTokens` | 출력 토큰 수 | Count |
| `LLMLatency` | LLM 응답 시간 | Milliseconds |

### 도구 메트릭

| 메트릭 | 설명 | 단위 |
|--------|------|------|
| `ToolInvocations` | 도구 호출 횟수 | Count |
| `ToolLatency` | 도구 실행 시간 | Milliseconds |
| `ToolErrors` | 도구 오류 횟수 | Count |

## 알람 설정

### 오류율 알람

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='AgentHighErrorRate',
    MetricName='AgentErrors',
    Namespace='AWS/BedrockAgentCore',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=2,
    Threshold=10,
    ComparisonOperator='GreaterThanThreshold',
    AlarmActions=['arn:aws:sns:us-west-2:123456789012:alerts'],
    Dimensions=[
        {'Name': 'AgentId', 'Value': 'my-agent-id'}
    ]
)
```

### 지연 시간 알람

```python
cloudwatch.put_metric_alarm(
    AlarmName='AgentHighLatency',
    MetricName='AgentLatency',
    Namespace='AWS/BedrockAgentCore',
    Statistic='p90',
    Period=300,
    EvaluationPeriods=3,
    Threshold=5000,  # 5초
    ComparisonOperator='GreaterThanThreshold',
    AlarmActions=['arn:aws:sns:us-west-2:123456789012:alerts'],
    Dimensions=[
        {'Name': 'AgentId', 'Value': 'my-agent-id'}
    ]
)
```

## Best Practices

### 1. 구조화된 로깅

```python
import logging
import json

logger = logging.getLogger(__name__)

def log_agent_event(event_type, data):
    logger.info(json.dumps({
        "event_type": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        **data
    }))

# 사용
log_agent_event("tool_call", {
    "tool_name": "search_database",
    "duration_ms": 150,
    "status": "success"
})
```

### 2. 커스텀 스팬 속성

```python
with tracer.start_as_current_span("process_request") as span:
    span.set_attribute("user.id", user_id)
    span.set_attribute("request.type", request_type)
    span.set_attribute("agent.version", "1.0.0")
```

### 3. 에러 트레이싱

```python
from opentelemetry.trace import Status, StatusCode

with tracer.start_as_current_span("risky_operation") as span:
    try:
        result = do_risky_work()
        span.set_status(Status(StatusCode.OK))
    except Exception as e:
        span.set_status(Status(StatusCode.ERROR, str(e)))
        span.record_exception(e)
        raise
```

### 4. 샘플링 설정

트래픽이 많은 프로덕션 환경에서는 샘플링을 설정하여 비용을 절감합니다:

```bash
export OTEL_TRACES_SAMPLER=parentbased_traceidratio
export OTEL_TRACES_SAMPLER_ARG=0.1  # 10% 샘플링
```

## 제약사항

| 항목 | 제한 |
|------|------|
| **트레이스 보관** | 30일 (기본) |
| **스팬 크기** | 최대 64KB |
| **속성 개수** | 스팬당 최대 128개 |
| **로그 보관** | CloudWatch Logs 설정에 따름 |
| **메트릭 해상도** | 최소 1분 |

## 비용 최적화

| 전략 | 설명 | 예상 절감 |
|------|------|----------|
| **샘플링** | 트래픽의 일부만 트레이싱 | 70-90% |
| **로그 보관 기간** | 필요한 기간만 보관 | 50-70% |
| **필터링** | 중요 이벤트만 로깅 | 30-50% |
| **집계** | 개별 이벤트 대신 집계 메트릭 | 40-60% |
