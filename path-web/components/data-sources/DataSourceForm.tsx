"use client";

import { useState } from "react";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Container from "@cloudscape-design/components/container";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Textarea from "@cloudscape-design/components/textarea";
import Tiles from "@cloudscape-design/components/tiles";
import TokenGroup from "@cloudscape-design/components/token-group";
import {
  ACCESS_PATTERNS,
  DATA_SOURCE_CATEGORIES,
  DATA_SOURCE_CATEGORY_LABELS,
  LATENCY_TIERS,
  type AccessPattern,
  type AuthMode,
  type DataSourceCategory,
  type DataSourceEntry,
  type LatencyTier,
} from "@/lib/data-source-catalog";
import { AUTH_MODES } from "@/lib/zod/data-source";

type ConfigMap = Record<string, string>;

export interface DataSourceFormValues {
  category: DataSourceCategory;
  name: string;
  description: string;
  tags: string[];
  auth_mode: AuthMode;
  secret_ref?: string;
  access_pattern?: AccessPattern;
  latency_tier?: LatencyTier;
  schema_hint?: string;
  config: ConfigMap;
}

interface ConfigFieldMeta {
  key: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  enumOptions?: readonly string[];
}

const CATEGORY_DESCRIPTIONS: Record<DataSourceCategory, string> = {
  RAG: "Bedrock KB·OpenSearch 등 검색/벡터 기반 지식베이스",
  RDBMS: "PostgreSQL·MySQL·Aurora 등 관계형 DB",
  S3: "객체 스토리지 — 문서·이미지·로그 아카이브",
  MCP: "Model Context Protocol 서버 (stdio / http)",
  GoogleSheets: "구글 스프레드시트",
  Notion: "Notion 워크스페이스·데이터베이스",
  Confluence: "Atlassian Confluence 공간",
  API: "HTTP 기반 3rd party API",
};

const RDB_ENGINE_OPTIONS = [
  "Aurora PostgreSQL",
  "Aurora MySQL",
  "PostgreSQL",
  "MySQL",
  "MariaDB",
  "SQL Server",
  "Oracle",
  "DB2",
] as const;

const CATEGORY_FIELDS: Record<DataSourceCategory, ConfigFieldMeta[]> = {
  RAG: [
    {
      key: "backend",
      label: "백엔드",
      required: true,
      enumOptions: ["bedrock_kb", "opensearch", "other"],
      description: "RAG 저장·검색 엔진을 선택하세요",
    },
    {
      key: "knowledge_base_id",
      label: "Knowledge Base ID",
      placeholder: "ABCDE12345",
      description: "backend=bedrock_kb일 때 필수",
    },
    {
      key: "endpoint",
      label: "Endpoint",
      placeholder: "https://search-...es.amazonaws.com",
      description: "backend=opensearch일 때 필수",
    },
    {
      key: "index",
      label: "Index",
      placeholder: "documents-v1",
    },
  ],
  RDBMS: [
    {
      key: "engine",
      label: "엔진",
      required: true,
      enumOptions: RDB_ENGINE_OPTIONS,
      placeholder: "엔진 선택",
    },
    {
      key: "database",
      label: "데이터베이스",
      required: true,
      placeholder: "appdb",
    },
    {
      key: "host",
      label: "호스트",
      placeholder: "db.internal / example.cluster-xxx.rds.amazonaws.com",
    },
    {
      key: "schema",
      label: "스키마",
      placeholder: "public",
    },
  ],
  S3: [
    {
      key: "bucket",
      label: "버킷",
      required: true,
      placeholder: "acme-logs",
    },
    {
      key: "prefix",
      label: "프리픽스",
      placeholder: "events/",
      description: "조회 경로를 좁히는 접두사",
    },
    {
      key: "region",
      label: "리전",
      placeholder: "ap-northeast-2",
    },
  ],
  MCP: [
    {
      key: "transport",
      label: "전송 방식",
      required: true,
      enumOptions: ["stdio", "http"],
    },
    {
      key: "endpoint_or_command",
      label: "엔드포인트 또는 실행 명령",
      required: true,
      placeholder: "https://... 또는 npx -y @modelcontextprotocol/server-...",
    },
    {
      key: "tools",
      label: "도구 (쉼표 구분)",
      placeholder: "read_file,write_file,list_directory",
      description: "MCP 서버가 노출하는 도구 이름 — agent 선택 참고용",
    },
  ],
  GoogleSheets: [
    {
      key: "spreadsheet_id",
      label: "Spreadsheet ID",
      required: true,
      placeholder: "1AbC...XyZ",
      description: "Google Sheets URL의 /d/<ID>/edit 부분",
    },
    {
      key: "worksheet_name",
      label: "워크시트 이름",
      placeholder: "Sheet1",
    },
    {
      key: "range",
      label: "범위",
      placeholder: "A1:D100",
    },
  ],
  Notion: [
    {
      key: "workspace_id",
      label: "Workspace ID",
      required: true,
      description: "Notion Integration에서 발급되는 Workspace 식별자",
    },
    {
      key: "database_id",
      label: "Database ID",
      placeholder: "(특정 DB에 국한하려면 입력)",
    },
    {
      key: "page_id",
      label: "Page ID",
      placeholder: "(특정 페이지로 국한)",
    },
  ],
  Confluence: [
    {
      key: "base_url",
      label: "Base URL",
      required: true,
      placeholder: "https://company.atlassian.net/wiki",
    },
    {
      key: "space_key",
      label: "Space Key",
      required: true,
      placeholder: "ENG",
      description: "공간 키 — 일반적으로 대문자 약어",
    },
    {
      key: "parent_page_id",
      label: "Parent Page ID",
      placeholder: "(하위 트리로 국한)",
    },
  ],
  API: [
    {
      key: "base_url",
      label: "Base URL",
      required: true,
      placeholder: "https://api.example.com",
    },
    {
      key: "openapi_ref",
      label: "OpenAPI 레퍼런스",
      placeholder: "https://api.example.com/openapi.json",
      description: "URL 또는 로컬 경로 — 선택",
    },
    {
      key: "key_endpoints",
      label: "주요 엔드포인트 (쉼표 구분)",
      placeholder: "/users,/orders",
      description: "agent가 자주 쓸 경로를 먼저 제시",
    },
  ],
};

/** storage 성격의 카테고리 — access_pattern / latency_tier / schema_hint 노출 */
const STORAGE_LIKE: DataSourceCategory[] = ["RAG", "RDBMS", "S3"];

const DEFAULTS: DataSourceFormValues = {
  category: "S3",
  name: "",
  description: "",
  tags: [],
  auth_mode: "none",
  config: {},
};

export interface DataSourceFormProps {
  mode: "create" | "edit";
  initialValue?: DataSourceFormValues;
  onSubmit: (values: DataSourceFormValues) => Promise<void>;
  onCancel: () => void;
  submitError?: string | null;
}

export function DataSourceForm({
  mode,
  initialValue,
  onSubmit,
  onCancel,
  submitError,
}: DataSourceFormProps) {
  const [v, setV] = useState<DataSourceFormValues>(initialValue ?? DEFAULTS);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof DataSourceFormValues>(
    k: K,
    val: DataSourceFormValues[K],
  ) => setV((prev) => ({ ...prev, [k]: val }));

  const setConfig = (key: string, value: string) =>
    setV((prev) => {
      const next = { ...prev.config };
      if (value.trim() === "") delete next[key];
      else next[key] = value;
      return { ...prev, config: next };
    });

  const changeCategory = (next: DataSourceCategory) => {
    if (mode === "edit") return;
    setV((prev) => ({
      ...prev,
      category: next,
      config: {},
      // storage-only 필드는 비-storage 카테고리에서 제거
      access_pattern: STORAGE_LIKE.includes(next) ? prev.access_pattern : undefined,
      latency_tier: STORAGE_LIKE.includes(next) ? prev.latency_tier : undefined,
      schema_hint: STORAGE_LIKE.includes(next) ? prev.schema_hint : undefined,
    }));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(v);
    } finally {
      setSubmitting(false);
    }
  };

  const categoryFields = CATEGORY_FIELDS[v.category];
  const showStorageExtras = STORAGE_LIKE.includes(v.category);
  const showSecretRef = v.auth_mode !== "none";

  return (
    <Form
      header={
        <Header variant="h1">
          {mode === "create" ? "새 데이터 소스" : "데이터 소스 편집"}
        </Header>
      }
      actions={
        <SpaceBetween size="xs" direction="horizontal">
          <Button onClick={onCancel} disabled={submitting}>
            취소
          </Button>
          <Button variant="primary" onClick={submit} loading={submitting}>
            {mode === "create" ? "등록" : "저장"}
          </Button>
        </SpaceBetween>
      }
      errorText={submitError ?? undefined}
    >
      <SpaceBetween size="l">
        <Container header={<Header variant="h2">공통 정보</Header>}>
          <SpaceBetween size="m">
            <FormField
              label="이름"
              description="카탈로그에서 항목을 식별할 이름 — Step1에서 선택 목록에 표시됩니다"
            >
              <Input
                value={v.name}
                onChange={({ detail }) => set("name", detail.value)}
                placeholder="예: 고객 주문 DB, 영업 KPI 시트"
              />
            </FormField>
            <FormField
              label="설명"
              description="이 데이터 소스가 무엇을 담고 있는지 — 용도·범위·업데이트 주기 등"
            >
              <Textarea
                value={v.description}
                onChange={({ detail }) => set("description", detail.value)}
                rows={3}
                placeholder="예: B2B 고객 주문 이력 — 최근 2년. 주 1회 적재. PII는 별도 테이블 분리."
              />
            </FormField>
            <FormField
              label="태그"
              description="검색·필터링용 키워드. 입력 후 Enter"
            >
              <TagEditor tags={v.tags} onChange={(tags) => set("tags", tags)} />
            </FormField>
            <ColumnLayout columns={2}>
              <FormField
                label="인증 모드"
                description="자격증명 값 자체는 저장하지 않습니다 — 런타임에 Secrets Manager 등을 통해 주입"
              >
                <Select
                  options={AUTH_MODES.map((m) => ({ label: m, value: m }))}
                  selectedOption={{ label: v.auth_mode, value: v.auth_mode }}
                  onChange={({ detail }) =>
                    set(
                      "auth_mode",
                      (detail.selectedOption.value as AuthMode) ?? "none",
                    )
                  }
                />
              </FormField>
              {showSecretRef && (
                <FormField
                  label="Secrets Manager ARN (선택)"
                  description="런타임에서 로드할 자격증명 포인터. 값 자체는 저장하지 않습니다."
                >
                  <Input
                    value={v.secret_ref ?? ""}
                    onChange={({ detail }) =>
                      set(
                        "secret_ref",
                        detail.value.trim() === "" ? undefined : detail.value,
                      )
                    }
                    placeholder="arn:aws:secretsmanager:..."
                  />
                </FormField>
              )}
            </ColumnLayout>
          </SpaceBetween>
        </Container>

        <Container
          header={
            <Header
              variant="h2"
              description="유형을 바꾸면 유형별 상세 입력이 초기화됩니다"
            >
              카테고리
            </Header>
          }
        >
          {mode === "edit" ? (
            <Alert type="info">
              카테고리는 생성 후 변경할 수 없습니다 (현재:{" "}
              <b>{DATA_SOURCE_CATEGORY_LABELS[v.category]}</b>).
            </Alert>
          ) : (
            <Tiles
              value={v.category}
              onChange={({ detail }) =>
                changeCategory(detail.value as DataSourceCategory)
              }
              columns={2}
              items={DATA_SOURCE_CATEGORIES.map((c) => ({
                value: c,
                label: DATA_SOURCE_CATEGORY_LABELS[c],
                description: CATEGORY_DESCRIPTIONS[c],
              }))}
            />
          )}
        </Container>

        <Container
          header={
            <Header
              variant="h2"
              description={`${DATA_SOURCE_CATEGORY_LABELS[v.category]} 연결에 필요한 식별자`}
            >
              {DATA_SOURCE_CATEGORY_LABELS[v.category]} 상세
            </Header>
          }
        >
          <SpaceBetween size="m">
            {showStorageExtras && (
              <ColumnLayout columns={2}>
                <FormField
                  label="접근 패턴"
                  description="이 데이터 소스를 읽기만 할지, 쓰기까지 할지"
                >
                  <Select
                    options={[
                      { label: "(미설정)", value: "" },
                      ...ACCESS_PATTERNS.map((a) => ({ label: a, value: a })),
                    ]}
                    selectedOption={{
                      label: v.access_pattern ?? "(미설정)",
                      value: v.access_pattern ?? "",
                    }}
                    onChange={({ detail }) =>
                      set(
                        "access_pattern",
                        (detail.selectedOption.value as AccessPattern) ||
                          undefined,
                      )
                    }
                  />
                </FormField>
                <FormField
                  label="지연 등급"
                  description="실시간 응답 vs 배치 처리 성격"
                >
                  <Select
                    options={[
                      { label: "(미설정)", value: "" },
                      ...LATENCY_TIERS.map((a) => ({ label: a, value: a })),
                    ]}
                    selectedOption={{
                      label: v.latency_tier ?? "(미설정)",
                      value: v.latency_tier ?? "",
                    }}
                    onChange={({ detail }) =>
                      set(
                        "latency_tier",
                        (detail.selectedOption.value as LatencyTier) ||
                          undefined,
                      )
                    }
                  />
                </FormField>
              </ColumnLayout>
            )}

            <ColumnLayout columns={2}>
              {categoryFields.map((f) => (
                <FormField
                  key={f.key}
                  label={
                    <span>
                      {f.label}
                      {f.required ? (
                        <Box display="inline" color="text-status-error">
                          {" *"}
                        </Box>
                      ) : (
                        <Box
                          display="inline"
                          variant="small"
                          color="text-body-secondary"
                        >
                          {" (선택)"}
                        </Box>
                      )}
                    </span>
                  }
                  description={f.description}
                >
                  {f.enumOptions ? (
                    <Select
                      options={f.enumOptions.map((o) => ({
                        label: o,
                        value: o,
                      }))}
                      selectedOption={
                        v.config[f.key]
                          ? { label: v.config[f.key], value: v.config[f.key] }
                          : null
                      }
                      onChange={({ detail }) =>
                        setConfig(f.key, detail.selectedOption.value ?? "")
                      }
                      placeholder={f.placeholder ?? "선택"}
                    />
                  ) : (
                    <Input
                      value={v.config[f.key] ?? ""}
                      onChange={({ detail }) => setConfig(f.key, detail.value)}
                      placeholder={f.placeholder}
                    />
                  )}
                </FormField>
              ))}
            </ColumnLayout>

            {showStorageExtras && (
              <FormField
                label="스키마/경로 힌트 (선택)"
                description="테이블·인덱스·버킷 경로 등 Agent 설계에 도움이 되는 구조 정보"
              >
                <Textarea
                  value={v.schema_hint ?? ""}
                  onChange={({ detail }) =>
                    set(
                      "schema_hint",
                      detail.value.trim() === "" ? undefined : detail.value,
                    )
                  }
                  rows={3}
                  placeholder="예: customers(id, name, email, created_at) / orders(id, customer_id, amount, status)"
                />
              </FormField>
            )}
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </Form>
  );
}

/**
 * 폼 값 → API 페이로드 변환.
 * 카테고리별 config 필드 중 배열형(쉼표 구분)은 split 처리하고, 빈 값은 생략.
 */
export function formValuesToPayload(
  v: DataSourceFormValues,
): Record<string, unknown> {
  const cfg: Record<string, unknown> = {};
  const fields = CATEGORY_FIELDS[v.category];
  for (const f of fields) {
    const raw = v.config[f.key];
    if (raw === undefined || raw === "") continue;
    if (f.key === "tools" || f.key === "key_endpoints") {
      const arr = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (arr.length) cfg[f.key] = arr;
    } else {
      cfg[f.key] = raw;
    }
  }
  const payload: Record<string, unknown> = {
    category: v.category,
    name: v.name,
    description: v.description,
    tags: v.tags,
    auth_mode: v.auth_mode,
    config: cfg,
  };
  if (v.secret_ref) payload.secret_ref = v.secret_ref;
  if (STORAGE_LIKE.includes(v.category)) {
    if (v.access_pattern) payload.access_pattern = v.access_pattern;
    if (v.latency_tier) payload.latency_tier = v.latency_tier;
    if (v.schema_hint) payload.schema_hint = v.schema_hint;
  }
  return payload;
}

/** 저장된 Entry → 폼 초기값 변환 (config 배열은 쉼표 문자열로 flatten). */
export function entryToFormValues(entry: DataSourceEntry): DataSourceFormValues {
  const cfg: ConfigMap = {};
  const rawCfg = entry.config as Record<string, unknown>;
  for (const [k, val] of Object.entries(rawCfg)) {
    if (Array.isArray(val)) cfg[k] = val.join(",");
    else if (val != null) cfg[k] = String(val);
  }
  return {
    category: entry.category,
    name: entry.name,
    description: entry.description,
    tags: entry.tags,
    auth_mode: entry.auth_mode,
    secret_ref: entry.secret_ref,
    access_pattern: entry.access_pattern,
    latency_tier: entry.latency_tier,
    schema_hint: entry.schema_hint,
    config: cfg,
  };
}

function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <SpaceBetween size="xs">
      <Input
        value={draft}
        onChange={({ detail }) => setDraft(detail.value)}
        onKeyDown={({ detail }) => {
          if (detail.key === "Enter") {
            const v = draft.trim();
            if (v && !tags.includes(v)) onChange([...tags, v]);
            setDraft("");
          }
        }}
        placeholder="입력 후 Enter"
      />
      {tags.length > 0 ? (
        <TokenGroup
          items={tags.map((t) => ({ label: t, dismissLabel: `${t} 제거` }))}
          onDismiss={({ detail }) =>
            onChange(tags.filter((_, i) => i !== detail.itemIndex))
          }
        />
      ) : (
        <Box variant="small" color="text-body-secondary">
          추가된 태그 없음
        </Box>
      )}
    </SpaceBetween>
  );
}
