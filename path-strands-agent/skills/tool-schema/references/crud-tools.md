# CRUD Tools (데이터 조작 도구)

## 개요

CRUD는 Create, Read, Update, Delete의 약자로 데이터의 기본적인 조작 작업을 의미합니다.

## Create (생성)

### 단일 레코드 생성

```json
{
  "name": "create_record",
  "description": "새 레코드를 생성합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "table": {
        "type": "string",
        "description": "테이블명",
        "enum": ["customers", "orders", "tasks"]
      },
      "data": {
        "type": "object",
        "description": "생성할 데이터"
      }
    },
    "required": ["table", "data"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "id": { "type": "string", "description": "생성된 레코드 ID" },
      "created_at": { "type": "string", "format": "date-time" }
    }
  }
}
```

### 고객 생성 (구체적 예시)

```json
{
  "name": "create_customer",
  "description": "새 고객을 등록합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "고객 이름"
      },
      "email": {
        "type": "string",
        "format": "email",
        "description": "이메일 주소"
      },
      "phone": {
        "type": "string",
        "description": "전화번호"
      },
      "company": {
        "type": "string",
        "description": "회사명 (선택)"
      },
      "tags": {
        "type": "array",
        "items": { "type": "string" },
        "description": "태그 목록"
      }
    },
    "required": ["name", "email"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "customer_id": { "type": "string" },
      "message": { "type": "string" }
    }
  }
}
```

### 작업 생성

```json
{
  "name": "create_task",
  "description": "새 작업을 생성합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "작업 제목"
      },
      "description": {
        "type": "string",
        "description": "작업 설명"
      },
      "assignee": {
        "type": "string",
        "description": "담당자 ID"
      },
      "due_date": {
        "type": "string",
        "format": "date",
        "description": "마감일 (YYYY-MM-DD)"
      },
      "priority": {
        "type": "string",
        "enum": ["low", "medium", "high", "urgent"],
        "default": "medium"
      },
      "labels": {
        "type": "array",
        "items": { "type": "string" }
      }
    },
    "required": ["title"]
  }
}
```

## Read (조회)

### 단일 레코드 조회

```json
{
  "name": "get_customer",
  "description": "고객 ID로 고객 정보를 조회합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "고객 ID"
      },
      "include": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["orders", "tickets", "notes"]
        },
        "description": "함께 조회할 관련 데이터"
      }
    },
    "required": ["customer_id"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "found": { "type": "boolean" },
      "customer": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "email": { "type": "string" },
          "created_at": { "type": "string" }
        }
      },
      "orders": { "type": "array" },
      "tickets": { "type": "array" }
    }
  }
}
```

## Update (수정)

### 레코드 수정

```json
{
  "name": "update_record",
  "description": "기존 레코드를 수정합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "table": {
        "type": "string",
        "enum": ["customers", "orders", "tasks"]
      },
      "id": {
        "type": "string",
        "description": "수정할 레코드 ID"
      },
      "data": {
        "type": "object",
        "description": "수정할 필드와 값"
      }
    },
    "required": ["table", "id", "data"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "updated_at": { "type": "string", "format": "date-time" },
      "previous_values": { "type": "object" }
    }
  }
}
```

### 상태 변경 (구체적 예시)

```json
{
  "name": "update_task_status",
  "description": "작업의 상태를 변경합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "작업 ID"
      },
      "status": {
        "type": "string",
        "enum": ["todo", "in_progress", "review", "done", "cancelled"],
        "description": "새 상태"
      },
      "comment": {
        "type": "string",
        "description": "상태 변경 사유 (선택)"
      }
    },
    "required": ["task_id", "status"]
  }
}
```

## Delete (삭제)

### 레코드 삭제

```json
{
  "name": "delete_record",
  "description": "레코드를 삭제합니다. 이 작업은 되돌릴 수 없습니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "table": {
        "type": "string",
        "enum": ["customers", "orders", "tasks"]
      },
      "id": {
        "type": "string",
        "description": "삭제할 레코드 ID"
      },
      "soft_delete": {
        "type": "boolean",
        "description": "소프트 삭제 여부 (true면 복구 가능)",
        "default": true
      }
    },
    "required": ["table", "id"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "deleted_at": { "type": "string" },
      "recoverable": { "type": "boolean" }
    }
  }
}
```

## 복합 작업

### Upsert (있으면 수정, 없으면 생성)

```json
{
  "name": "upsert_record",
  "description": "레코드가 있으면 수정하고, 없으면 생성합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "table": {
        "type": "string"
      },
      "key": {
        "type": "object",
        "description": "레코드를 식별할 키 (예: {\"email\": \"user@example.com\"})"
      },
      "data": {
        "type": "object",
        "description": "저장할 데이터"
      }
    },
    "required": ["table", "key", "data"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": ["created", "updated"]
      },
      "id": { "type": "string" }
    }
  }
}
```

## 설계 팁

1. **명확한 설명**: Write 작업은 부작용을 명확히 설명
2. **확인 메커니즘**: 삭제 등 위험한 작업은 확인 단계 고려
3. **응답에 변경 내용 포함**: 이전 값, 새 값 등 포함
4. **트랜잭션 고려**: 여러 작업이 연관될 때 원자성 보장
