---
name: tool-schema
description: Agent Tool 스키마 정의 가이드. JSON Schema 형식으로 도구의 입출력을 정의하는 방법.
license: Apache-2.0
metadata:
  version: "1.0"
  author: path-team
---

# Tool Schema Design

AI Agent가 사용하는 도구(Tool)의 스키마를 정의하는 가이드입니다.

## 기본 구조

```json
{
  "name": "tool_name",
  "description": "도구 설명 (Agent가 언제 이 도구를 사용해야 하는지 포함)",
  "input_schema": {
    "type": "object",
    "properties": {
      "param1": {
        "type": "string",
        "description": "파라미터 설명"
      }
    },
    "required": ["param1"]
  }
}
```

## 일반적인 도구 패턴

| 패턴 | 용도 | Reference |
|------|------|-----------|
| **Search** | 정보 검색, 조회 | `search-tools.md` |
| **CRUD** | 데이터 생성/조회/수정/삭제 | `crud-tools.md` |
| **External API** | 외부 서비스 연동 | `external-api-tools.md` |
| **Transform** | 데이터 변환, 포맷팅 | `transform-tools.md` |
| **Notification** | 알림 전송 | `notification-tools.md` |

## JSON Schema 기본 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| `string` | 문자열 | `"hello"` |
| `number` | 숫자 (정수/실수) | `42`, `3.14` |
| `integer` | 정수만 | `42` |
| `boolean` | 참/거짓 | `true`, `false` |
| `array` | 배열 | `[1, 2, 3]` |
| `object` | 객체 | `{"key": "value"}` |
| `null` | null 값 | `null` |

## Quick Examples

### 검색 도구

```json
{
  "name": "search_documents",
  "description": "문서 저장소에서 키워드로 문서를 검색합니다. 사용자가 정보를 찾을 때 사용하세요.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "검색 키워드"
      },
      "limit": {
        "type": "integer",
        "description": "반환할 최대 결과 수",
        "default": 10
      }
    },
    "required": ["query"]
  }
}
```

### 데이터 조회 도구

```json
{
  "name": "get_customer",
  "description": "고객 ID로 고객 정보를 조회합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "고객 고유 식별자"
      }
    },
    "required": ["customer_id"]
  }
}
```

### 알림 전송 도구

```json
{
  "name": "send_email",
  "description": "이메일을 전송합니다. 사용자에게 알림이나 보고서를 보낼 때 사용하세요.",
  "input_schema": {
    "type": "object",
    "properties": {
      "to": {
        "type": "string",
        "description": "수신자 이메일 주소"
      },
      "subject": {
        "type": "string",
        "description": "이메일 제목"
      },
      "body": {
        "type": "string",
        "description": "이메일 본문"
      }
    },
    "required": ["to", "subject", "body"]
  }
}
```

## 출력 스키마 정의

```json
{
  "name": "search_documents",
  "description": "문서 검색",
  "input_schema": {...},
  "output_schema": {
    "type": "object",
    "properties": {
      "results": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "title": { "type": "string" },
            "snippet": { "type": "string" },
            "score": { "type": "number" }
          }
        }
      },
      "total_count": { "type": "integer" }
    }
  }
}
```

## Available References

상세 스키마 예시가 필요하면 `skill_tool`로 로드:

- `search-tools.md` - 검색 도구 스키마 예시
- `crud-tools.md` - CRUD 도구 스키마 예시
- `external-api-tools.md` - 외부 API 연동 도구
- `transform-tools.md` - 데이터 변환 도구
- `notification-tools.md` - 알림/메시징 도구

**사용 예시:**
```
skill_tool(skill_name="tool-schema", reference="search-tools.md")
```

## Best Practices

1. **명확한 설명**: description에 "언제" 사용하는지 포함
2. **타입 명시**: 모든 파라미터에 적절한 타입 지정
3. **필수/선택 구분**: required 배열에 필수 파라미터만
4. **기본값 제공**: 선택 파라미터에는 default 값
5. **검증 조건**: enum, minimum, maximum 등 활용
