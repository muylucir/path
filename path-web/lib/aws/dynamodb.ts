import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Session, SessionListItem } from "@/lib/types";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-northeast-2",
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "path-agent-sessions";

export async function saveSession(sessionData: Omit<Session, "session_id" | "timestamp">): Promise<string> {
  const session_id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const item: Session = {
    session_id,
    timestamp,
    ...sessionData,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );

  return session_id;
}

export async function loadSession(sessionId: string): Promise<Session | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { session_id: sessionId },
    })
  );

  return (response.Item as Session) || null;
}

// TODO: Production에서는 GSI를 생성하여 Query로 전환 필요
// aws dynamodb update-table --table-name path-agent-sessions \
//   --attribute-definitions AttributeName=gsi_pk,AttributeType=S AttributeName=timestamp,AttributeType=S \
//   --global-secondary-index-updates '[{"Create":{"IndexName":"gsi-timestamp","KeySchema":[{"AttributeName":"gsi_pk","KeyType":"HASH"},{"AttributeName":"timestamp","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}}]'
export async function listSessions(limit: number = 15, lastEvaluatedKey?: Record<string, unknown>): Promise<{ sessions: SessionListItem[], lastEvaluatedKey?: Record<string, unknown> }> {
  // NOTE: Scan + Limit does not guarantee the most recent items are returned.
  // DynamoDB Scan returns items in an arbitrary order and Limit caps the number
  // of items evaluated, not the final result set. To reliably return the latest
  // sessions sorted by timestamp, a GSI with timestamp as the sort key is needed
  // so we can use Query with ScanIndexForward=false.

  // Before passing lastEvaluatedKey to DynamoDB, validate its structure
  let validatedKey: Record<string, unknown> | undefined;
  if (lastEvaluatedKey) {
    // Only allow the expected key structure
    if (typeof lastEvaluatedKey.session_id === "string") {
      validatedKey = { session_id: lastEvaluatedKey.session_id };
    }
    // If the key structure is invalid, start from the beginning
  }

  const response = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      Limit: limit,
      ProjectionExpression: "session_id, #ts, pain_point, feasibility_score, improved_feasibility, next_steps",
      ExpressionAttributeNames: { "#ts": "timestamp" },
      ...(validatedKey && { ExclusiveStartKey: validatedKey }),
    })
  );

  const items = (response.Items || []) as SessionListItem[];
  return {
    sessions: items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown> | undefined,
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { session_id: sessionId },
    })
  );
}

export async function replaceSession(
  sessionId: string,
  sessionData: Omit<Session, "session_id" | "timestamp">
): Promise<void> {
  const item: Session = {
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    ...sessionData,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    })
  );
}
