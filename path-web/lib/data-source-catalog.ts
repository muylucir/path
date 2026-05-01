/**
 * 데이터 소스 카탈로그 타입·카테고리 정의.
 *
 * 실제 저장은 DynamoDB (path-agent-sessions 테이블, entity_type="DataSource")
 * 에 위임한다. Step1에서 사용자가 자연어로 서술하던 외부 리소스를 여기에
 * 등록된 항목으로 선택할 수 있게 하며, 카탈로그가 비어있으면 Step1 UI는
 * 자연어 입력(additionalSources)만 노출한다.
 */

export const DATA_SOURCE_CATEGORIES = [
  "RAG",
  "GraphRAG",
  "RDBMS",
  "S3",
  "MCP",
  "GoogleSheets",
  "Notion",
  "Confluence",
  "API",
] as const;

export type DataSourceCategory = (typeof DATA_SOURCE_CATEGORIES)[number];

export const DATA_SOURCE_CATEGORY_LABELS: Record<DataSourceCategory, string> = {
  RAG: "RAG / 지식베이스",
  GraphRAG: "GraphRAG / 지식그래프",
  RDBMS: "RDBMS",
  S3: "S3",
  MCP: "MCP 서버",
  GoogleSheets: "Google Sheets",
  Notion: "Notion",
  Confluence: "Confluence",
  API: "3rd party API",
};

export type AuthMode =
  | "none"
  | "iam"
  | "oauth2"
  | "api_key"
  | "basic"
  | "custom";

export const ACCESS_PATTERNS = ["read-only", "read-write"] as const;
export type AccessPattern = (typeof ACCESS_PATTERNS)[number];

export const LATENCY_TIERS = ["realtime", "batch"] as const;
export type LatencyTier = (typeof LATENCY_TIERS)[number];

export interface DataSourceBase {
  id: string;
  name: string;
  description: string;
  tags: string[];
  auth_mode: AuthMode;
  /** Secrets Manager ARN 등 런타임에서 자격증명을 로드할 opaque 포인터. 값 자체는 저장하지 않음. */
  secret_ref?: string;
  /** storage류(RAG/GraphRAG/RDBMS/S3)에 유의미. 읽기 전용인지 쓰기까지 필요한지. */
  access_pattern?: AccessPattern;
  /** 실시간(realtime) vs 배치(batch) 성격. */
  latency_tier?: LatencyTier;
  /** 스키마/경로/컬렉션 구조를 agent에게 전달할 자유 서술. */
  schema_hint?: string;
}

export type DataSourceEntry =
  | (DataSourceBase & {
      category: "RAG";
      config: {
        backend: "bedrock_kb" | "opensearch" | "other";
        knowledge_base_id?: string;
        endpoint?: string;
        index?: string;
      };
    })
  | (DataSourceBase & {
      category: "GraphRAG";
      config: {
        backend: "neptune" | "neptune_analytics" | "neo4j" | "other";
        endpoint?: string;
        graph_id?: string;
        database?: string;
      };
    })
  | (DataSourceBase & {
      category: "RDBMS";
      config: {
        engine: string;
        database: string;
        host?: string;
        schema?: string;
      };
    })
  | (DataSourceBase & {
      category: "S3";
      config: { bucket: string; prefix?: string; region?: string };
    })
  | (DataSourceBase & {
      category: "MCP";
      config: {
        transport: "stdio" | "http";
        endpoint_or_command: string;
        tools?: string[];
      };
    })
  | (DataSourceBase & {
      category: "GoogleSheets";
      config: {
        spreadsheet_id: string;
        worksheet_name?: string;
        range?: string;
      };
    })
  | (DataSourceBase & {
      category: "Notion";
      config: {
        workspace_id: string;
        database_id?: string;
        page_id?: string;
      };
    })
  | (DataSourceBase & {
      category: "Confluence";
      config: { base_url: string; space_key: string; parent_page_id?: string };
    })
  | (DataSourceBase & {
      category: "API";
      config: {
        base_url: string;
        openapi_ref?: string;
        key_endpoints?: string[];
      };
    });

/**
 * 저장된 카탈로그 항목(서버 응답 envelope 포함).
 */
export interface StoredDataSource {
  entry: DataSourceEntry;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * LLM payload로 전달되는 카탈로그 항목의 구조화된 형태.
 * config 원본 대신 category별 식별자를 config_summary 한 줄로 요약하고,
 * secret_ref 같은 민감 포인터는 존재 여부만 boolean으로 노출한다.
 */
export interface StructuredDataSourceEntry {
  id: string;
  name: string;
  category: DataSourceCategory;
  description: string;
  tags: string[];
  auth_mode: AuthMode;
  has_secret_ref: boolean;
  access_pattern?: AccessPattern;
  latency_tier?: LatencyTier;
  schema_hint?: string;
  config_summary: string;
}

export function toStructuredEntry(entry: DataSourceEntry): StructuredDataSourceEntry {
  return {
    id: entry.id,
    name: entry.name,
    category: entry.category,
    description: entry.description,
    tags: entry.tags,
    auth_mode: entry.auth_mode,
    has_secret_ref: !!entry.secret_ref,
    access_pattern: entry.access_pattern,
    latency_tier: entry.latency_tier,
    schema_hint: entry.schema_hint,
    config_summary: identifierLine(entry),
  };
}

/**
 * 프롬프트·결과 표시에 쓸 단일 라인 요약.
 *   예) "S3 s3://acme-logs/events/ — 고객 로그 버킷"
 *       "GoogleSheets <spreadsheet_id> — 매출 시트"
 */
export function compactDataSourceEntry(entry: DataSourceEntry): string {
  const head = identifierLine(entry);
  return `${head} — ${entry.name}`;
}

export function identifierLine(entry: DataSourceEntry): string {
  switch (entry.category) {
    case "RAG": {
      const cfg = entry.config;
      if (cfg.backend === "bedrock_kb" && cfg.knowledge_base_id)
        return `RAG(BedrockKB ${cfg.knowledge_base_id})`;
      if (cfg.backend === "opensearch" && cfg.endpoint)
        return `RAG(OpenSearch ${cfg.endpoint}${cfg.index ? `#${cfg.index}` : ""})`;
      return "RAG";
    }
    case "GraphRAG": {
      const cfg = entry.config;
      if (cfg.backend === "neptune" && cfg.endpoint)
        return `GraphRAG(Neptune ${cfg.endpoint}${cfg.database ? `/${cfg.database}` : ""})`;
      if (cfg.backend === "neptune_analytics" && cfg.graph_id)
        return `GraphRAG(NeptuneAnalytics ${cfg.graph_id})`;
      if (cfg.backend === "neo4j" && cfg.endpoint)
        return `GraphRAG(Neo4j ${cfg.endpoint}${cfg.database ? `/${cfg.database}` : ""})`;
      return "GraphRAG";
    }
    case "RDBMS": {
      const cfg = entry.config;
      const host = cfg.host ? `${cfg.engine}://${cfg.host}` : cfg.engine;
      return `RDBMS ${host}/${cfg.database}`;
    }
    case "S3": {
      const cfg = entry.config;
      const base = `s3://${cfg.bucket}`;
      return cfg.prefix
        ? `S3 ${base}/${cfg.prefix.replace(/^\//, "")}`
        : `S3 ${base}`;
    }
    case "MCP": {
      const cfg = entry.config;
      const tools = cfg.tools?.length
        ? ` tools=${cfg.tools.slice(0, 3).join(",")}`
        : "";
      return `MCP(${cfg.transport}) ${cfg.endpoint_or_command}${tools}`;
    }
    case "GoogleSheets":
      return `GoogleSheets ${entry.config.spreadsheet_id}${
        entry.config.worksheet_name ? `#${entry.config.worksheet_name}` : ""
      }`;
    case "Notion": {
      const cfg = entry.config;
      const tail = cfg.database_id
        ? `/db:${cfg.database_id}`
        : cfg.page_id
          ? `/page:${cfg.page_id}`
          : "";
      return `Notion ${cfg.workspace_id}${tail}`;
    }
    case "Confluence":
      return `Confluence ${entry.config.base_url} space=${entry.config.space_key}`;
    case "API":
      return `API ${entry.config.base_url}`;
  }
}
