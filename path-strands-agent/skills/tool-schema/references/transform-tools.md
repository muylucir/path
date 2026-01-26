# Transform Tools (데이터 변환 도구)

## 개요

데이터를 한 형식에서 다른 형식으로 변환하거나 가공하는 도구입니다.

## 형식 변환

### JSON 파싱

```json
{
  "name": "parse_json",
  "description": "JSON 문자열을 파싱하여 객체로 변환합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "json_string": {
        "type": "string",
        "description": "파싱할 JSON 문자열"
      }
    },
    "required": ["json_string"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "success": { "type": "boolean" },
      "data": { "type": "object" },
      "error": { "type": "string" }
    }
  }
}
```

### CSV to JSON

```json
{
  "name": "csv_to_json",
  "description": "CSV 데이터를 JSON 배열로 변환합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "csv_content": {
        "type": "string",
        "description": "CSV 형식의 데이터"
      },
      "delimiter": {
        "type": "string",
        "default": ",",
        "description": "구분자"
      },
      "has_header": {
        "type": "boolean",
        "default": true,
        "description": "첫 행이 헤더인지 여부"
      }
    },
    "required": ["csv_content"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "data": {
        "type": "array",
        "items": { "type": "object" }
      },
      "row_count": { "type": "integer" },
      "columns": {
        "type": "array",
        "items": { "type": "string" }
      }
    }
  }
}
```

### Markdown to HTML

```json
{
  "name": "markdown_to_html",
  "description": "Markdown 텍스트를 HTML로 변환합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "markdown": {
        "type": "string",
        "description": "변환할 Markdown 텍스트"
      },
      "sanitize": {
        "type": "boolean",
        "default": true,
        "description": "위험한 HTML 태그 제거 여부"
      }
    },
    "required": ["markdown"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "html": { "type": "string" }
    }
  }
}
```

## 텍스트 처리

### 텍스트 요약

```json
{
  "name": "summarize_text",
  "description": "긴 텍스트를 요약합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "요약할 텍스트"
      },
      "max_length": {
        "type": "integer",
        "description": "최대 요약 길이 (문자 수)",
        "default": 500
      },
      "style": {
        "type": "string",
        "enum": ["bullet_points", "paragraph", "one_line"],
        "default": "paragraph"
      }
    },
    "required": ["text"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "summary": { "type": "string" },
      "original_length": { "type": "integer" },
      "summary_length": { "type": "integer" }
    }
  }
}
```

### 텍스트 추출

```json
{
  "name": "extract_entities",
  "description": "텍스트에서 엔티티(이름, 날짜, 금액 등)를 추출합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "text": {
        "type": "string",
        "description": "분석할 텍스트"
      },
      "entity_types": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["person", "organization", "date", "money", "location", "email", "phone"]
        },
        "description": "추출할 엔티티 유형"
      }
    },
    "required": ["text"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "entities": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": { "type": "string" },
            "value": { "type": "string" },
            "start": { "type": "integer" },
            "end": { "type": "integer" }
          }
        }
      }
    }
  }
}
```

## 수치 계산

### 단위 변환

```json
{
  "name": "convert_units",
  "description": "단위를 변환합니다 (길이, 무게, 온도 등).",
  "input_schema": {
    "type": "object",
    "properties": {
      "value": {
        "type": "number",
        "description": "변환할 값"
      },
      "from_unit": {
        "type": "string",
        "description": "원본 단위 (예: 'km', 'kg', 'celsius')"
      },
      "to_unit": {
        "type": "string",
        "description": "대상 단위 (예: 'miles', 'lb', 'fahrenheit')"
      }
    },
    "required": ["value", "from_unit", "to_unit"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "result": { "type": "number" },
      "formula": { "type": "string" }
    }
  }
}
```

### 수학 계산

```json
{
  "name": "calculate",
  "description": "수학 표현식을 계산합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "expression": {
        "type": "string",
        "description": "계산할 수식 (예: '(100 + 50) * 1.1')"
      },
      "precision": {
        "type": "integer",
        "description": "소수점 자릿수",
        "default": 2
      }
    },
    "required": ["expression"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "result": { "type": "number" },
      "expression": { "type": "string" }
    }
  }
}
```

## 날짜/시간 처리

### 날짜 포맷 변환

```json
{
  "name": "format_date",
  "description": "날짜를 다른 형식으로 변환합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "변환할 날짜 문자열"
      },
      "input_format": {
        "type": "string",
        "description": "입력 형식 (예: 'YYYY-MM-DD')"
      },
      "output_format": {
        "type": "string",
        "description": "출력 형식 (예: 'MMMM D, YYYY')"
      },
      "timezone": {
        "type": "string",
        "description": "타임존 (예: 'Asia/Seoul')"
      }
    },
    "required": ["date", "output_format"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "formatted_date": { "type": "string" }
    }
  }
}
```

### 시간 차이 계산

```json
{
  "name": "calculate_time_diff",
  "description": "두 날짜/시간 사이의 차이를 계산합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "start": {
        "type": "string",
        "format": "date-time",
        "description": "시작 시간"
      },
      "end": {
        "type": "string",
        "format": "date-time",
        "description": "종료 시간"
      },
      "unit": {
        "type": "string",
        "enum": ["seconds", "minutes", "hours", "days", "weeks", "months", "years"],
        "default": "days"
      }
    },
    "required": ["start", "end"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "difference": { "type": "number" },
      "unit": { "type": "string" },
      "human_readable": { "type": "string" }
    }
  }
}
```

## 설계 팁

1. **입력 검증**: 변환 전 입력 형식 검증
2. **오류 처리**: 변환 실패 시 명확한 에러 메시지
3. **정밀도**: 숫자 변환 시 정밀도 손실 주의
4. **인코딩**: 텍스트 처리 시 문자 인코딩 고려
