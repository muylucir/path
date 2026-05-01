/**
 * DataSource 카탈로그 Zod 스키마.
 * API 라우트 validation + 카테고리별 config 필수 필드 검증.
 */

import { z } from "zod";
import {
  ACCESS_PATTERNS,
  DATA_SOURCE_CATEGORIES,
  LATENCY_TIERS,
} from "@/lib/data-source-catalog";

export const AUTH_MODES = [
  "none",
  "iam",
  "oauth2",
  "api_key",
  "basic",
  "custom",
] as const;

const baseFields = {
  name: z.string().min(1).max(120),
  description: z.string().max(2000).default(""),
  tags: z.array(z.string().min(1).max(40)).max(10).default([]),
  auth_mode: z.enum(AUTH_MODES),
  secret_ref: z.string().max(2048).optional(),
  access_pattern: z.enum(ACCESS_PATTERNS).optional(),
  latency_tier: z.enum(LATENCY_TIERS).optional(),
  schema_hint: z.string().max(2000).optional(),
};

const ragConfig = z
  .object({
    backend: z.enum(["bedrock_kb", "opensearch", "other"]),
    knowledge_base_id: z.string().max(200).optional(),
    endpoint: z.string().max(2048).optional(),
    index: z.string().max(200).optional(),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.backend === "bedrock_kb" && !cfg.knowledge_base_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["knowledge_base_id"],
        message: "bedrock_kb 백엔드는 knowledge_base_id가 필요합니다",
      });
    }
    if (cfg.backend === "opensearch" && !cfg.endpoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endpoint"],
        message: "opensearch 백엔드는 endpoint가 필요합니다",
      });
    }
  });

const graphRagConfig = z
  .object({
    backend: z.enum(["neptune", "neptune_analytics", "neo4j", "other"]),
    endpoint: z.string().max(2048).optional(),
    graph_id: z.string().max(200).optional(),
    database: z.string().max(200).optional(),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.backend === "neptune" && !cfg.endpoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endpoint"],
        message: "neptune 백엔드는 endpoint가 필요합니다",
      });
    }
    if (cfg.backend === "neptune_analytics" && !cfg.graph_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graph_id"],
        message: "neptune_analytics 백엔드는 graph_id가 필요합니다",
      });
    }
    if (cfg.backend === "neo4j" && !cfg.endpoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endpoint"],
        message: "neo4j 백엔드는 endpoint(bolt://... 또는 neo4j://...)가 필요합니다",
      });
    }
  });

const rdbmsConfig = z.object({
  engine: z.string().min(1).max(60),
  database: z.string().min(1).max(120),
  host: z.string().max(255).optional(),
  schema: z.string().max(120).optional(),
});

const s3Config = z.object({
  bucket: z.string().min(1).max(255),
  prefix: z.string().max(1024).optional(),
  region: z.string().max(40).optional(),
});

const mcpConfig = z.object({
  transport: z.enum(["stdio", "http"]),
  endpoint_or_command: z.string().min(1).max(2048),
  tools: z.array(z.string().min(1).max(120)).max(50).optional(),
});

const googleSheetsConfig = z.object({
  spreadsheet_id: z.string().min(1).max(200),
  worksheet_name: z.string().max(120).optional(),
  range: z.string().max(120).optional(),
});

const notionConfig = z.object({
  workspace_id: z.string().min(1).max(200),
  database_id: z.string().max(200).optional(),
  page_id: z.string().max(200).optional(),
});

const confluenceConfig = z.object({
  base_url: z.string().url().max(2048),
  space_key: z.string().min(1).max(120),
  parent_page_id: z.string().max(200).optional(),
});

const apiConfig = z.object({
  base_url: z.string().url().max(2048),
  openapi_ref: z.string().max(2048).optional(),
  key_endpoints: z.array(z.string().min(1).max(256)).max(50).optional(),
});

/**
 * 생성 요청 — id는 서버가 생성. category별 discriminated union.
 */
export const dataSourceCreateSchema = z.discriminatedUnion("category", [
  z.object({ ...baseFields, category: z.literal("RAG"), config: ragConfig }),
  z.object({
    ...baseFields,
    category: z.literal("GraphRAG"),
    config: graphRagConfig,
  }),
  z.object({ ...baseFields, category: z.literal("RDBMS"), config: rdbmsConfig }),
  z.object({ ...baseFields, category: z.literal("S3"), config: s3Config }),
  z.object({ ...baseFields, category: z.literal("MCP"), config: mcpConfig }),
  z.object({
    ...baseFields,
    category: z.literal("GoogleSheets"),
    config: googleSheetsConfig,
  }),
  z.object({
    ...baseFields,
    category: z.literal("Notion"),
    config: notionConfig,
  }),
  z.object({
    ...baseFields,
    category: z.literal("Confluence"),
    config: confluenceConfig,
  }),
  z.object({ ...baseFields, category: z.literal("API"), config: apiConfig }),
]);
export type DataSourceCreateInput = z.infer<typeof dataSourceCreateSchema>;

/** 편집 요청 — category는 불변이라 create와 동일 body를 다시 받는다. */
export const dataSourceUpdateSchema = dataSourceCreateSchema;
export type DataSourceUpdateInput = z.infer<typeof dataSourceUpdateSchema>;

export { DATA_SOURCE_CATEGORIES };
