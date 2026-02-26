import { ConditionalCheckFailedException, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
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
const GSI_NAME = "user-sessions-index";

export async function saveSession(
  userId: string,
  sessionData: Omit<Session, "session_id" | "user_id" | "timestamp">
): Promise<string> {
  const session_id = crypto.randomUUID();
  const timestamp = new Date().toISOString();

  const item: Session = {
    session_id,
    user_id: userId,
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

export async function loadSession(sessionId: string, userId: string): Promise<Session | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { session_id: sessionId },
    })
  );

  const session = response.Item as Session | undefined;
  if (!session) return null;

  // Ownership check
  if (session.user_id !== userId) return null;

  return session;
}

export async function listSessions(
  userId: string,
  limit: number = 15,
  lastEvaluatedKey?: Record<string, unknown>
): Promise<{ sessions: SessionListItem[]; lastEvaluatedKey?: Record<string, unknown> }> {
  // Validate lastEvaluatedKey structure for GSI pagination
  let validatedKey: Record<string, unknown> | undefined;
  if (lastEvaluatedKey) {
    if (
      typeof lastEvaluatedKey.session_id === "string" &&
      typeof lastEvaluatedKey.user_id === "string" &&
      typeof lastEvaluatedKey.timestamp === "string"
    ) {
      validatedKey = {
        session_id: lastEvaluatedKey.session_id,
        user_id: lastEvaluatedKey.user_id,
        timestamp: lastEvaluatedKey.timestamp,
      };
    }
  }

  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_NAME,
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: { ":uid": userId },
      ProjectionExpression: "session_id, user_id, #ts, pain_point, feasibility_score, improved_feasibility, next_steps, token_usage",
      ExpressionAttributeNames: { "#ts": "timestamp" },
      ScanIndexForward: false,
      Limit: limit,
      ...(validatedKey && { ExclusiveStartKey: validatedKey }),
    })
  );

  return {
    sessions: (response.Items || []) as SessionListItem[],
    lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown> | undefined,
  };
}

export async function deleteSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { session_id: sessionId },
        ConditionExpression: "user_id = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );
    return true;
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      return false;
    }
    throw err;
  }
}

export async function replaceSession(
  sessionId: string,
  userId: string,
  sessionData: Omit<Session, "session_id" | "user_id" | "timestamp">
): Promise<boolean> {
  const item: Session = {
    session_id: sessionId,
    user_id: userId,
    timestamp: new Date().toISOString(),
    ...sessionData,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "user_id = :uid",
        ExpressionAttributeValues: { ":uid": userId },
      })
    );
    return true;
  } catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      return false;
    }
    throw err;
  }
}
