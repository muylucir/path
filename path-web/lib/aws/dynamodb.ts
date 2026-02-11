import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type { Session, SessionListItem } from "@/lib/types";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-northeast-2",
});

const docClient = DynamoDBDocumentClient.from(client);
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

export async function listSessions(limit: number = 15, lastEvaluatedKey?: any): Promise<{ sessions: SessionListItem[], lastEvaluatedKey?: any }> {
  const response = await docClient.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      Limit: limit,
      ProjectionExpression: "session_id, #ts, pain_point, feasibility_score, improved_feasibility, next_steps",
      ExpressionAttributeNames: { "#ts": "timestamp" },
      ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
    })
  );

  const items = (response.Items || []) as SessionListItem[];
  return {
    sessions: items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    lastEvaluatedKey: response.LastEvaluatedKey,
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

export async function updateSessionSpecification(
  sessionId: string,
  specification: string
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { session_id: sessionId },
      UpdateExpression: "SET specification = :spec, #ts = :ts",
      ExpressionAttributeNames: { "#ts": "timestamp" },
      ExpressionAttributeValues: {
        ":spec": specification,
        ":ts": new Date().toISOString(),
      },
    })
  );
}
