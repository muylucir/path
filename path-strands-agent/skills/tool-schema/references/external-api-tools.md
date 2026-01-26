# External API Tools (외부 API 연동 도구)

## 개요

외부 서비스 API와 연동하는 도구입니다. 인증, 에러 처리, 속도 제한 등을 고려해야 합니다.

## HTTP 요청 도구

### 범용 HTTP 요청

```json
{
  "name": "http_request",
  "description": "외부 API에 HTTP 요청을 보냅니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "format": "uri",
        "description": "요청 URL"
      },
      "method": {
        "type": "string",
        "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"],
        "default": "GET"
      },
      "headers": {
        "type": "object",
        "description": "요청 헤더"
      },
      "body": {
        "type": "object",
        "description": "요청 본문 (POST/PUT/PATCH)"
      },
      "timeout": {
        "type": "integer",
        "description": "타임아웃 (초)",
        "default": 30
      }
    },
    "required": ["url"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "status_code": { "type": "integer" },
      "headers": { "type": "object" },
      "body": { "type": "object" },
      "elapsed_time": { "type": "number" }
    }
  }
}
```

## 날씨 API

```json
{
  "name": "get_weather",
  "description": "특정 위치의 현재 날씨 정보를 조회합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "location": {
        "type": "string",
        "description": "도시명 또는 위치 (예: '서울', 'Seoul, KR')"
      },
      "units": {
        "type": "string",
        "enum": ["metric", "imperial"],
        "default": "metric",
        "description": "단위 (metric: 섭씨, imperial: 화씨)"
      }
    },
    "required": ["location"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "location": { "type": "string" },
      "temperature": { "type": "number" },
      "feels_like": { "type": "number" },
      "humidity": { "type": "integer" },
      "description": { "type": "string" },
      "wind_speed": { "type": "number" },
      "timestamp": { "type": "string" }
    }
  }
}
```

## 번역 API

```json
{
  "name": "translate_text",
  "description": "텍스트를 다른 언어로 번역합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "번역할 텍스트"
      },
      "source_language": {
        "type": "string",
        "description": "원본 언어 코드 (예: 'ko', 'en'). 자동 감지하려면 생략"
      },
      "target_language": {
        "type": "string",
        "description": "대상 언어 코드 (예: 'en', 'ja')"
      }
    },
    "required": ["text", "target_language"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "translated_text": { "type": "string" },
      "detected_source_language": { "type": "string" },
      "confidence": { "type": "number" }
    }
  }
}
```

## 결제 API

```json
{
  "name": "process_payment",
  "description": "결제를 처리합니다. 민감한 작업이므로 사용자 확인 후 실행하세요.",
  "input_schema": {
    "type": "object",
    "properties": {
      "amount": {
        "type": "number",
        "description": "결제 금액",
        "minimum": 0
      },
      "currency": {
        "type": "string",
        "enum": ["KRW", "USD", "EUR", "JPY"],
        "default": "KRW"
      },
      "payment_method_id": {
        "type": "string",
        "description": "등록된 결제 수단 ID"
      },
      "description": {
        "type": "string",
        "description": "결제 설명"
      },
      "metadata": {
        "type": "object",
        "description": "추가 메타데이터"
      }
    },
    "required": ["amount", "payment_method_id"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "transaction_id": { "type": "string" },
      "status": {
        "type": "string",
        "enum": ["succeeded", "pending", "failed"]
      },
      "error_message": { "type": "string" }
    }
  }
}
```

## 캘린더 API

### 일정 조회

```json
{
  "name": "get_calendar_events",
  "description": "캘린더에서 일정을 조회합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "calendar_id": {
        "type": "string",
        "description": "캘린더 ID (기본: primary)"
      },
      "start_date": {
        "type": "string",
        "format": "date",
        "description": "조회 시작일"
      },
      "end_date": {
        "type": "string",
        "format": "date",
        "description": "조회 종료일"
      },
      "max_results": {
        "type": "integer",
        "default": 10
      }
    },
    "required": ["start_date", "end_date"]
  }
}
```

### 일정 생성

```json
{
  "name": "create_calendar_event",
  "description": "새 캘린더 일정을 생성합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "일정 제목"
      },
      "start_time": {
        "type": "string",
        "format": "date-time",
        "description": "시작 시간 (ISO 8601)"
      },
      "end_time": {
        "type": "string",
        "format": "date-time",
        "description": "종료 시간 (ISO 8601)"
      },
      "location": {
        "type": "string",
        "description": "장소"
      },
      "description": {
        "type": "string",
        "description": "설명"
      },
      "attendees": {
        "type": "array",
        "items": { "type": "string", "format": "email" },
        "description": "참석자 이메일 목록"
      },
      "reminder_minutes": {
        "type": "integer",
        "description": "알림 (분 전)",
        "default": 30
      }
    },
    "required": ["title", "start_time", "end_time"]
  }
}
```

## 메시징 API

### Slack 메시지

```json
{
  "name": "send_slack_message",
  "description": "Slack 채널에 메시지를 보냅니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "channel": {
        "type": "string",
        "description": "채널 ID 또는 이름 (예: '#general')"
      },
      "text": {
        "type": "string",
        "description": "메시지 텍스트"
      },
      "blocks": {
        "type": "array",
        "description": "Block Kit 블록 (고급 포맷팅)"
      },
      "thread_ts": {
        "type": "string",
        "description": "스레드 ID (답글일 경우)"
      }
    },
    "required": ["channel", "text"]
  }
}
```

## 설계 팁

1. **인증 분리**: API 키는 도구 스키마에 포함하지 않고 별도 관리
2. **에러 처리**: API 실패 시 명확한 에러 메시지 반환
3. **속도 제한**: Rate limit 고려하여 재시도 로직 구현
4. **타임아웃**: 적절한 타임아웃 설정으로 무한 대기 방지
5. **멱등성**: 가능하면 멱등한 작업으로 설계
