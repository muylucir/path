import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const MODEL_ID = "global.anthropic.claude-opus-4-5-20251101-v1:0";

export interface BedrockMessage {
  role: "user" | "assistant";
  content: string;
}

export async function invokeClaude(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages = [{ role: "user", content: prompt }];

  const body: any = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 16000,
    messages,
    temperature: 0.5,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    body: JSON.stringify(body),
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));
  return result.content[0].text;
}

export async function* invokeClaudeStream(
  prompt: string,
  systemPrompt?: string
): AsyncGenerator<string> {
  const messages = [{ role: "user", content: prompt }];

  const body: any = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 16000,
    messages,
    temperature: 0.5,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: MODEL_ID,
    body: JSON.stringify(body),
  });

  const response = await client.send(command);

  if (response.body) {
    for await (const event of response.body) {
      if (event.chunk?.bytes) {
        const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
        if (chunk.type === "content_block_delta") {
          if (chunk.delta?.text) {
            yield chunk.delta.text;
          }
        }
      }
    }
  }
}
