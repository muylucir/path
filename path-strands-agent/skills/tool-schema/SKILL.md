---
name: tool-schema
description: Agent Tool 스키마 정의 가이드. Compact Signature 형식으로 도구를 간결하게 정의하는 방법.
license: Apache-2.0
metadata:
  version: "2.0"
  author: path-team
---

# Tool Schema Design (Compact Signature Format)

AI Agent가 사용하는 도구(Tool)를 **Compact Signature 형식**으로 정의하는 가이드입니다.

> **왜 Compact Signature인가?**
> - JSON Schema는 토큰 소모가 큼 (tool당 ~500 토큰)
> - Compact Signature는 ~50 토큰으로 동일 정보 전달
> - 가독성 향상, 명세서 간결화

## Compact Signature Format

```
### [tool_name]
- **Purpose**: [도구의 목적 1문장]
- **Signature**: `tool_name(param1: type, param2?: type = default) -> ReturnType`
- **When to use**: [Agent가 이 도구를 사용해야 하는 상황]
```

## Signature 규칙

### 파라미터 표기
| 표기 | 의미 | 예시 |
|------|------|------|
| `param: type` | 필수 파라미터 | `query: str` |
| `param?: type` | 선택 파라미터 | `limit?: int` |
| `param?: type = default` | 선택 + 기본값 | `limit?: int = 10` |

### 기본 타입
| 타입 | 설명 | 예시 값 |
|------|------|---------|
| `str` | 문자열 | `"hello"` |
| `int` | 정수 | `42` |
| `float` | 실수 | `3.14` |
| `bool` | 불리언 | `true`, `false` |
| `None` | 없음 | `null` |

### 복합 타입
| 타입 | 설명 | 예시 |
|------|------|------|
| `list[T]` | T 타입의 배열 | `list[str]`, `list[Document]` |
| `dict` | 임의의 객체 | `{"key": "value"}` |
| `{field: type}` | 구조체 | `{id: str, name: str}` |
| `T \| None` | nullable | `str \| None` |

### 반환 타입
```
-> type                           # 단일 타입
-> {field1: type, field2: type}   # 구조체 반환
-> list[T]                        # 배열 반환
-> None                           # 반환값 없음 (side effect만)
```

## Quick Examples

### 검색 도구
```
### search_documents
- **Purpose**: 문서 저장소에서 키워드로 문서 검색
- **Signature**: `search_documents(query: str, limit?: int = 10) -> list[{id: str, title: str, score: float}]`
- **When to use**: 사용자가 정보를 찾거나 질문할 때
```

### 데이터 조회 도구
```
### get_customer
- **Purpose**: 고객 ID로 고객 정보 조회
- **Signature**: `get_customer(customer_id: str) -> {id: str, name: str, email: str, tier: str}`
- **When to use**: 특정 고객의 상세 정보가 필요할 때
```

### 데이터 생성 도구
```
### create_ticket
- **Purpose**: 새 지원 티켓 생성
- **Signature**: `create_ticket(title: str, description: str, priority?: str = "medium") -> {ticket_id: str, created_at: str}`
- **When to use**: 고객 문의를 접수하거나 이슈를 등록할 때
```

### 알림 전송 도구
```
### send_email
- **Purpose**: 이메일 발송
- **Signature**: `send_email(to: str, subject: str, body: str, cc?: list[str]) -> {success: bool, message_id?: str}`
- **When to use**: 사용자에게 결과를 알리거나 보고서를 전송할 때
```

### 외부 API 연동
```
### call_weather_api
- **Purpose**: 날씨 정보 조회
- **Signature**: `call_weather_api(city: str, date?: str) -> {temp: float, condition: str, humidity: int}`
- **When to use**: 날씨 관련 질문에 답할 때
```

### Side Effect 도구
```
### log_event
- **Purpose**: 이벤트 로깅 (반환값 없음)
- **Signature**: `log_event(event_type: str, payload: dict) -> None`
- **When to use**: 중요 이벤트를 기록할 때
```

## 일반적인 도구 패턴

| 패턴 | 용도 | 시그니처 패턴 |
|------|------|---------------|
| **Search** | 정보 검색 | `(query: str, ...) -> list[Result]` |
| **Get** | 단일 조회 | `(id: str) -> Entity` |
| **List** | 목록 조회 | `(filter?: dict) -> list[Entity]` |
| **Create** | 생성 | `(data: ...) -> {id: str, ...}` |
| **Update** | 수정 | `(id: str, data: ...) -> Entity` |
| **Delete** | 삭제 | `(id: str) -> {success: bool}` |
| **Send** | 전송 | `(to: str, content: ...) -> {success: bool}` |

## Best Practices

1. **Purpose는 1문장으로**: 간결하게 핵심만
2. **When to use 명시**: Agent가 언제 사용할지 명확하게
3. **타입은 구체적으로**: `dict` 대신 `{field: type}` 선호
4. **기본값 활용**: 선택 파라미터에는 합리적인 기본값
5. **반환 타입 명시**: Agent가 결과 처리 방법을 알 수 있도록

## JSON Schema 변환 (구현 시)

Compact Signature → JSON Schema 변환은 코드 생성 단계에서 자동 처리:

```
`search(query: str, limit?: int = 10) -> list[Result]`

↓ 자동 변환 ↓

{
  "name": "search",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {"type": "string"},
      "limit": {"type": "integer", "default": 10}
    },
    "required": ["query"]
  }
}
```
