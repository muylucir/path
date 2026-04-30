/**
 * DataSource 카탈로그 DynamoDB repo.
 *
 * 저장소는 세션과 동일한 테이블(path-agent-sessions)을 재사용한다.
 * `session_id` 파티션 키에 `ds_<uuid>` 형태로 저장하고 entity_type 속성으로
 * Session/DataSource를 구분한다. 기존 세션은 entity_type 속성이 없으므로
 * 조회 시 `attribute_not_exists(entity_type) OR entity_type = 'Session'`로
 * 호환 처리한다.
 */

import {
  ConditionalCheckFailedException,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { DataSourceEntry, StoredDataSource } from "@/lib/data-source-catalog";

const client = new DynamoDBClient({
  region:
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    "ap-northeast-2",
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "path-agent-sessions";
const DS_ID_PREFIX = "ds_";
const ENTITY_TYPE = "DataSource";

export type DataSourceScope = "personal" | "shared";

/**
 * 배포 시 주입되는 스코프. `personal`은 사용자별 격리(기본),
 * `shared`는 동일 UserPool 구성원 전체 공유 카탈로그.
 * 쓰기/삭제는 두 모드 모두 소유자만 가능.
 */
export function getDataSourceScope(): DataSourceScope {
  return process.env.DATA_SOURCE_SCOPE === "shared" ? "shared" : "personal";
}

interface DataSourceRow {
  session_id: string; // primary key — "ds_<uuid>"
  entity_type: typeof ENTITY_TYPE;
  entry: DataSourceEntry;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

function toStored(row: DataSourceRow): StoredDataSource {
  return {
    entry: row.entry,
    owner_id: row.owner_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function makeDataSourceId(): string {
  return `${DS_ID_PREFIX}${crypto.randomUUID()}`;
}

export async function listDataSources(
  userId: string,
): Promise<StoredDataSource[]> {
  const scope = getDataSourceScope();
  const items: DataSourceRow[] = [];
  let cursor: Record<string, unknown> | undefined;

  const filterParts = ["entity_type = :t"];
  const values: Record<string, unknown> = { ":t": ENTITY_TYPE };
  if (scope === "personal") {
    filterParts.push("owner_id = :uid");
    values[":uid"] = userId;
  }

  do {
    const res = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterParts.join(" AND "),
        ExpressionAttributeValues: values,
        ExclusiveStartKey: cursor,
      }),
    );
    items.push(...((res.Items ?? []) as DataSourceRow[]));
    cursor = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (cursor);
  return items
    .map(toStored)
    .sort((a, b) => a.entry.name.localeCompare(b.entry.name));
}

export async function getDataSource(
  id: string,
  userId?: string,
): Promise<StoredDataSource | null> {
  const res = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { session_id: id },
    }),
  );
  const row = res.Item as DataSourceRow | undefined;
  if (!row || row.entity_type !== ENTITY_TYPE) return null;
  if (userId !== undefined) {
    const scope = getDataSourceScope();
    if (scope === "personal" && row.owner_id !== userId) return null;
  }
  return toStored(row);
}

export async function putDataSource(input: {
  entry: DataSourceEntry;
  owner_id: string;
}): Promise<StoredDataSource> {
  const now = new Date().toISOString();
  const row: DataSourceRow = {
    session_id: input.entry.id,
    entity_type: ENTITY_TYPE,
    entry: input.entry,
    owner_id: input.owner_id,
    created_at: now,
    updated_at: now,
  };
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: row,
        ConditionExpression: "attribute_not_exists(session_id)",
      }),
    );
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new Error(`DataSource ${input.entry.id} already exists`);
    }
    throw err;
  }
  return toStored(row);
}

export async function replaceDataSource(input: {
  entry: DataSourceEntry;
  owner_id: string;
}): Promise<StoredDataSource | null> {
  const existing = await getDataSource(input.entry.id);
  if (!existing) return null;
  if (existing.owner_id !== input.owner_id) return null;
  const row: DataSourceRow = {
    session_id: input.entry.id,
    entity_type: ENTITY_TYPE,
    entry: input.entry,
    owner_id: existing.owner_id,
    created_at: existing.created_at,
    updated_at: new Date().toISOString(),
  };
  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: row,
        ConditionExpression: "owner_id = :uid AND entity_type = :t",
        ExpressionAttributeValues: {
          ":uid": input.owner_id,
          ":t": ENTITY_TYPE,
        },
      }),
    );
    return toStored(row);
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return null;
    throw err;
  }
}

export async function deleteDataSource(
  id: string,
  ownerId: string,
): Promise<boolean> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { session_id: id },
        ConditionExpression: "owner_id = :uid AND entity_type = :t",
        ExpressionAttributeValues: {
          ":uid": ownerId,
          ":t": ENTITY_TYPE,
        },
      }),
    );
    return true;
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) return false;
    throw err;
  }
}

export async function getDataSourcesByIds(
  ids: readonly string[],
  userId: string,
): Promise<StoredDataSource[]> {
  if (ids.length === 0) return [];
  const unique = Array.from(new Set(ids));
  const results = await Promise.all(
    unique.map((id) => getDataSource(id, userId).catch(() => null)),
  );
  return results.filter((r): r is StoredDataSource => r !== null);
}
