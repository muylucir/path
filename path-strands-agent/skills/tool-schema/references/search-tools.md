# Search Tools (검색 도구)

## 개요

검색 도구는 데이터를 조회하고 찾는 용도로 사용됩니다. Read-only 작업으로 부작용이 없습니다.

## 키워드 검색

### 기본 검색

```json
{
  "name": "search",
  "description": "키워드로 콘텐츠를 검색합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "검색 키워드 또는 구문"
      },
      "limit": {
        "type": "integer",
        "description": "반환할 최대 결과 수",
        "default": 10,
        "minimum": 1,
        "maximum": 100
      }
    },
    "required": ["query"]
  },
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
            "url": { "type": "string" },
            "score": { "type": "number" }
          }
        }
      },
      "total": { "type": "integer" },
      "has_more": { "type": "boolean" }
    }
  }
}
```

### 필터링 검색

```json
{
  "name": "search_with_filters",
  "description": "필터 조건과 함께 검색합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "검색 키워드"
      },
      "filters": {
        "type": "object",
        "description": "필터 조건",
        "properties": {
          "category": {
            "type": "string",
            "enum": ["news", "blog", "document"]
          },
          "date_from": {
            "type": "string",
            "format": "date",
            "description": "검색 시작일 (YYYY-MM-DD)"
          },
          "date_to": {
            "type": "string",
            "format": "date",
            "description": "검색 종료일 (YYYY-MM-DD)"
          },
          "author": {
            "type": "string",
            "description": "작성자 이름"
          }
        }
      },
      "sort": {
        "type": "string",
        "enum": ["relevance", "date", "popularity"],
        "default": "relevance"
      }
    },
    "required": ["query"]
  }
}
```

## 데이터베이스 조회

### 단일 레코드 조회

```json
{
  "name": "get_record",
  "description": "ID로 단일 레코드를 조회합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "table": {
        "type": "string",
        "description": "테이블명",
        "enum": ["customers", "orders", "products"]
      },
      "id": {
        "type": "string",
        "description": "레코드 ID"
      },
      "fields": {
        "type": "array",
        "items": { "type": "string" },
        "description": "조회할 필드 목록 (빈 배열이면 전체)"
      }
    },
    "required": ["table", "id"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "found": { "type": "boolean" },
      "data": { "type": "object" }
    }
  }
}
```

### 목록 조회

```json
{
  "name": "list_records",
  "description": "조건에 맞는 레코드 목록을 조회합니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "table": {
        "type": "string",
        "enum": ["customers", "orders", "products"]
      },
      "where": {
        "type": "object",
        "description": "필터 조건 (키-값 쌍)"
      },
      "order_by": {
        "type": "string",
        "description": "정렬 필드"
      },
      "order": {
        "type": "string",
        "enum": ["asc", "desc"],
        "default": "asc"
      },
      "limit": {
        "type": "integer",
        "default": 20
      },
      "offset": {
        "type": "integer",
        "default": 0
      }
    },
    "required": ["table"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "data": {
        "type": "array",
        "items": { "type": "object" }
      },
      "total": { "type": "integer" },
      "limit": { "type": "integer" },
      "offset": { "type": "integer" }
    }
  }
}
```

## 벡터 검색 (시맨틱 검색)

```json
{
  "name": "semantic_search",
  "description": "의미 기반으로 유사한 문서를 검색합니다. 키워드가 정확히 일치하지 않아도 의미적으로 관련된 결과를 찾습니다.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "검색 질의 (자연어)"
      },
      "collection": {
        "type": "string",
        "description": "검색할 문서 컬렉션"
      },
      "top_k": {
        "type": "integer",
        "description": "반환할 결과 수",
        "default": 5
      },
      "min_score": {
        "type": "number",
        "description": "최소 유사도 점수 (0-1)",
        "default": 0.7
      }
    },
    "required": ["query", "collection"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "results": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "string" },
            "content": { "type": "string" },
            "score": { "type": "number" },
            "metadata": { "type": "object" }
          }
        }
      }
    }
  }
}
```

## 웹 검색

```json
{
  "name": "web_search",
  "description": "인터넷에서 정보를 검색합니다. 최신 정보나 실시간 데이터가 필요할 때 사용하세요.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "검색 질의"
      },
      "num_results": {
        "type": "integer",
        "default": 5,
        "maximum": 10
      },
      "time_range": {
        "type": "string",
        "enum": ["day", "week", "month", "year", "all"],
        "default": "all"
      }
    },
    "required": ["query"]
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "results": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": { "type": "string" },
            "url": { "type": "string" },
            "snippet": { "type": "string" },
            "published_date": { "type": "string" }
          }
        }
      }
    }
  }
}
```

## 설계 팁

1. **페이지네이션**: 대량 결과는 limit/offset 지원
2. **정렬 옵션**: 사용자가 원하는 순서로 결과 정렬
3. **유사도 점수**: 검색 결과에 관련성 점수 포함
4. **빈 결과 처리**: 결과가 없을 때의 응답 구조 명확히
