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
  region: process.env.AWS_REGION || "us-east-1",
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "path-agent-sessions";

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

export async function listSessions(limit: number = 10): Promise<SessionListItem[]> {
  const response = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      Limit: limit,
      ProjectionExpression: "session_id, #ts, pain_point, feasibility_score",
      ExpressionAttributeNames: { "#ts": "timestamp" },
    })
  );

  const items = (response.Items || []) as SessionListItem[];
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function deleteSession(sessionId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { session_id: sessionId },
    })
  );
}
