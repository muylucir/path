# Notification Tools (알림 도구)

## 개요

사용자나 시스템에 알림을 전송하는 도구입니다.

## 이메일

### 이메일 발송

```json
{
  "name": "send_email",
  "description": "이메일을 발송합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "to": {
        "type": "array",
        "items": { "type": "string", "format": "email" },
        "description": "수신자 이메일 주소 목록"
      },
      "cc": {
        "type": "array",
        "items": { "type": "string", "format": "email" },
        "description": "참조 이메일 주소 목록"
      },
      "subject": {
        "type": "string",
        "description": "이메일 제목"
      },
      "body": {
        "type": "string",
        "description": "이메일 본문"
      },
      "body_type": {
        "type": "string",
        "enum": ["text", "html"],
        "default": "text",
        "description": "본문 형식"
      },
      "attachments": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "filename": { "type": "string" },
            "content": { "type": "string", "description": "Base64 인코딩된 내용" },
            "content_type": { "type": "string" }
          }
        },
        "description": "첨부 파일 목록"
      },
      "priority": {
        "type": "string",
        "enum": ["low", "normal", "high"],
        "default": "normal"
      }
    },
    "required": ["to", "subject", "body"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "message_id": { "type": "string" },
      "sent_at": { "type": "string", "format": "date-time" }
    }
  }
}
```

## SMS

### SMS 발송

```json
{
  "name": "send_sms",
  "description": "SMS 문자 메시지를 발송합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "to": {
        "type": "string",
        "description": "수신자 전화번호 (국제 형식: +821012345678)"
      },
      "message": {
        "type": "string",
        "description": "메시지 내용 (90자 이내 권장)",
        "maxLength": 160
      }
    },
    "required": ["to", "message"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "message_id": { "type": "string" },
      "segments": { "type": "integer", "description": "분할된 메시지 수" },
      "cost": { "type": "number" }
    }
  }
}
```

## 메시징 플랫폼

### Slack 알림

```json
{
  "name": "send_slack_notification",
  "description": "Slack 채널에 알림을 보냅니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "channel": {
        "type": "string",
        "description": "채널 ID 또는 이름"
      },
      "message": {
        "type": "string",
        "description": "알림 메시지"
      },
      "level": {
        "type": "string",
        "enum": ["info", "warning", "error", "success"],
        "default": "info",
        "description": "알림 수준 (색상에 반영)"
      },
      "title": {
        "type": "string",
        "description": "알림 제목"
      },
      "fields": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "value": { "type": "string" },
            "inline": { "type": "boolean" }
          }
        },
        "description": "추가 필드 (Block Kit 형식)"
      },
      "mention": {
        "type": "array",
        "items": { "type": "string" },
        "description": "멘션할 사용자 ID 목록"
      }
    },
    "required": ["channel", "message"]
  }
}
```

### Microsoft Teams 알림

```json
{
  "name": "send_teams_notification",
  "description": "Microsoft Teams 채널에 알림을 보냅니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "webhook_url": {
        "type": "string",
        "format": "uri",
        "description": "Teams 웹훅 URL"
      },
      "title": {
        "type": "string",
        "description": "카드 제목"
      },
      "text": {
        "type": "string",
        "description": "메시지 본문"
      },
      "theme_color": {
        "type": "string",
        "description": "테마 색상 (hex code, 예: 'FF0000')"
      },
      "sections": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "facts": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": { "type": "string" },
                  "value": { "type": "string" }
                }
              }
            }
          }
        }
      }
    },
    "required": ["webhook_url", "text"]
  }
}
```

## 푸시 알림

### 모바일 푸시

```json
{
  "name": "send_push_notification",
  "description": "모바일 앱에 푸시 알림을 보냅니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "사용자 ID"
      },
      "title": {
        "type": "string",
        "description": "알림 제목"
      },
      "body": {
        "type": "string",
        "description": "알림 본문"
      },
      "data": {
        "type": "object",
        "description": "앱에 전달할 데이터"
      },
      "badge": {
        "type": "integer",
        "description": "앱 아이콘 배지 숫자"
      },
      "sound": {
        "type": "string",
        "description": "알림 소리"
      },
      "priority": {
        "type": "string",
        "enum": ["normal", "high"],
        "default": "normal"
      }
    },
    "required": ["user_id", "title", "body"]
  }
}
```

## 웹훅

### 웹훅 호출

```json
{
  "name": "call_webhook",
  "description": "지정된 URL로 웹훅을 호출합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "url": {
        "type": "string",
        "format": "uri",
        "description": "웹훅 URL"
      },
      "method": {
        "type": "string",
        "enum": ["POST", "PUT"],
        "default": "POST"
      },
      "payload": {
        "type": "object",
        "description": "전송할 데이터"
      },
      "headers": {
        "type": "object",
        "description": "추가 헤더"
      },
      "retry_count": {
        "type": "integer",
        "default": 3,
        "description": "실패 시 재시도 횟수"
      }
    },
    "required": ["url", "payload"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "status_code": { "type": "integer" },
      "response": { "type": "object" },
      "attempts": { "type": "integer" }
    }
  }
}
```

## 내부 알림

### 인앱 알림

```json
{
  "name": "create_notification",
  "description": "사용자의 알림함에 알림을 생성합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "user_id": {
        "type": "string",
        "description": "알림 받을 사용자 ID"
      },
      "type": {
        "type": "string",
        "enum": ["info", "warning", "success", "error", "action_required"],
        "description": "알림 유형"
      },
      "title": {
        "type": "string",
        "description": "알림 제목"
      },
      "message": {
        "type": "string",
        "description": "알림 내용"
      },
      "action_url": {
        "type": "string",
        "description": "클릭 시 이동할 URL"
      },
      "expires_at": {
        "type": "string",
        "format": "date-time",
        "description": "알림 만료 시간"
      }
    },
    "required": ["user_id", "type", "title", "message"]
  }
}
```

## 설계 팁

1. **발신자 정보**: 발신자가 명확히 표시되도록
2. **수신 확인**: 가능한 경우 읽음 확인 제공
3. **재시도 로직**: 전송 실패 시 재시도 메커니즘
4. **속도 제한**: 스팸 방지를 위한 발송 제한
5. **템플릿 활용**: 자주 사용하는 알림은 템플릿화
