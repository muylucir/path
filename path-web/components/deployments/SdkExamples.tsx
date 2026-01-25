"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import type { Deployment } from "@/lib/types";

interface SdkExamplesProps {
  deployment: Deployment;
}

export function SdkExamples({ deployment }: SdkExamplesProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // Use runtime_id directly, or extract from runtime_arn as fallback
  // ARN format: arn:aws:bedrock:region:account:agent-runtime/runtime_id
  const runtimeId = deployment.runtime_id
    || deployment.runtime_arn?.split("/").pop()
    || "{runtime_id}";
  const region = deployment.region || "us-west-2";

  const copyToClipboard = async (code: string, tab: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const pythonCode = `import boto3
import json

# AgentCore Runtime 클라이언트 생성
client = boto3.client('bedrock-agent-runtime', region_name='${region}')

def invoke_agent(prompt: str, session_id: str = "session-001"):
    response = client.invoke_agent(
        agentId='${runtimeId}',
        agentAliasId='TSTALIASID',
        sessionId=session_id,
        inputText=prompt
    )

    # 스트리밍 응답 처리
    result = ""
    for event in response['completion']:
        if 'chunk' in event:
            result += event['chunk']['bytes'].decode('utf-8')

    return result

# 사용 예시
if __name__ == "__main__":
    response = invoke_agent("안녕하세요, 무엇을 도와드릴까요?")
    print(response)`;

  const typescriptCode = `import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ region: "${region}" });

async function invokeAgent(prompt: string, sessionId = "session-001") {
  const command = new InvokeAgentCommand({
    agentId: "${runtimeId}",
    agentAliasId: "TSTALIASID",
    sessionId,
    inputText: prompt,
  });

  const response = await client.send(command);

  // 스트리밍 응답 처리
  let result = "";
  if (response.completion) {
    for await (const event of response.completion) {
      if (event.chunk?.bytes) {
        result += new TextDecoder().decode(event.chunk.bytes);
      }
    }
  }

  return result;
}

// 사용 예시
invokeAgent("안녕하세요, 무엇을 도와드릴까요?")
  .then(console.log)
  .catch(console.error);`;

  const javaCode = `import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.bedrockagentruntime.BedrockAgentRuntimeClient;
import software.amazon.awssdk.services.bedrockagentruntime.model.*;

public class AgentInvoker {
    private final BedrockAgentRuntimeClient client;

    public AgentInvoker() {
        this.client = BedrockAgentRuntimeClient.builder()
            .region(Region.of("${region}"))
            .build();
    }

    public String invokeAgent(String prompt, String sessionId) {
        InvokeAgentRequest request = InvokeAgentRequest.builder()
            .agentId("${runtimeId}")
            .agentAliasId("TSTALIASID")
            .sessionId(sessionId)
            .inputText(prompt)
            .build();

        StringBuilder result = new StringBuilder();
        InvokeAgentIterable response = client.invokeAgentPaginator(request);

        for (InvokeAgentResponse page : response) {
            // 스트리밍 응답 처리
            result.append(page.completion().toString());
        }

        return result.toString();
    }

    public static void main(String[] args) {
        AgentInvoker invoker = new AgentInvoker();
        String response = invoker.invokeAgent("안녕하세요", "session-001");
        System.out.println(response);
    }
}`;

  const CodeBlock = ({
    code,
    language,
    tab,
  }: {
    code: string;
    language: string;
    tab: string;
  }) => (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0"
        onClick={() => copyToClipboard(code, tab)}
      >
        {copiedTab === tab ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>
          배포된 에이전트를 호출하기 위한 SDK 예제 코드입니다.
        </p>
        <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
          <div>Agent Name: {deployment.agent_name}</div>
          <div>Runtime ID: {runtimeId}</div>
          <div>Region: {region}</div>
        </div>
      </div>

      <Tabs defaultValue="python" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="typescript">TypeScript</TabsTrigger>
          <TabsTrigger value="java">Java</TabsTrigger>
        </TabsList>
        <TabsContent value="python" className="mt-4">
          <CodeBlock code={pythonCode} language="python" tab="python" />
          <div className="mt-2 text-xs text-muted-foreground">
            필요 패키지: <code className="bg-muted px-1 rounded">pip install boto3</code>
          </div>
        </TabsContent>
        <TabsContent value="typescript" className="mt-4">
          <CodeBlock code={typescriptCode} language="typescript" tab="typescript" />
          <div className="mt-2 text-xs text-muted-foreground">
            필요 패키지: <code className="bg-muted px-1 rounded">npm install @aws-sdk/client-bedrock-agent-runtime</code>
          </div>
        </TabsContent>
        <TabsContent value="java" className="mt-4">
          <CodeBlock code={javaCode} language="java" tab="java" />
          <div className="mt-2 text-xs text-muted-foreground">
            Maven 의존성: <code className="bg-muted px-1 rounded">software.amazon.awssdk:bedrockagentruntime</code>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
