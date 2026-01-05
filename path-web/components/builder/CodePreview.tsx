"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, FileCode, Settings, Package } from "lucide-react";
import type { AgentCanvasState } from "@/lib/types";

interface CodePreviewProps {
  canvasState: AgentCanvasState;
}

export function CodePreview({ canvasState }: CodePreviewProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState({
    agent: "",
    agentcore: "",
    requirements: "",
  });

  useEffect(() => {
    setGeneratedCode(generateCode(canvasState));
  }, [canvasState]);

  const handleCopy = async (code: string, type: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">생성된 코드</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          캔버스의 에이전트 구성을 기반으로 Strands Agent SDK 코드가 생성됩니다.
        </p>
      </div>

      <Tabs defaultValue="agent" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="agent" className="gap-2">
            <FileCode className="h-4 w-4" />
            agent.py
          </TabsTrigger>
          <TabsTrigger value="agentcore" className="gap-2">
            <Settings className="h-4 w-4" />
            agentcore_config.py
          </TabsTrigger>
          <TabsTrigger value="requirements" className="gap-2">
            <Package className="h-4 w-4" />
            requirements.txt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent">
          <CodeBlock
            code={generatedCode.agent}
            language="python"
            copied={copied === "agent"}
            onCopy={() => handleCopy(generatedCode.agent, "agent")}
          />
        </TabsContent>

        <TabsContent value="agentcore">
          <CodeBlock
            code={generatedCode.agentcore}
            language="python"
            copied={copied === "agentcore"}
            onCopy={() => handleCopy(generatedCode.agentcore, "agentcore")}
          />
        </TabsContent>

        <TabsContent value="requirements">
          <CodeBlock
            code={generatedCode.requirements}
            language="text"
            copied={copied === "requirements"}
            onCopy={() => handleCopy(generatedCode.requirements, "requirements")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  language: string;
  copied: boolean;
  onCopy: () => void;
}

function CodeBlock({ code, language, copied, onCopy }: CodeBlockProps) {
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="absolute top-3 right-3 gap-2"
        onClick={onCopy}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            복사됨
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            복사
          </>
        )}
      </Button>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function generateCode(canvasState: AgentCanvasState): {
  agent: string;
  agentcore: string;
  requirements: string;
} {
  const agentNodes = canvasState.nodes.filter((n) => n.type === "agent");
  const routerNodes = canvasState.nodes.filter((n) => n.type === "router");

  // Generate agent.py
  const agentImports = `"""
Strands Agent SDK - Generated Code
Pattern: ${canvasState.metadata?.pattern || "Graph Pattern"}
Generated: ${new Date().toISOString()}
"""

from strands import Agent
from strands.multiagent import GraphBuilder
from strands.models import BedrockModel
`;

  const agentDefinitions = agentNodes
    .map((node) => {
      const data = node.data as {
        name: string;
        role: string;
        systemPrompt: string;
        llm: { model: string };
        tools: string[];
      };
      const modelId =
        data.llm.model === "claude-sonnet-4.5"
          ? "global.anthropic.claude-sonnet-4-5-20250929-v1:0"
          : "global.anthropic.claude-haiku-4-5-20250929-v1:0";

      return `
# ${data.name}
${toSnakeCase(data.name)}_model = BedrockModel(
    model_id="${modelId}",
    max_tokens=8192,
    temperature=0.3
)

${toSnakeCase(data.name)} = Agent(
    model=${toSnakeCase(data.name)}_model,
    system_prompt="""${data.systemPrompt || data.role}""",
    tools=[${data.tools.map((t) => `${t}`).join(", ")}]
)`;
    })
    .join("\n");

  const graphBuilder = `
# Graph Builder
builder = GraphBuilder()

# Add nodes
${agentNodes.map((node) => `builder.add_node("${node.id}", ${toSnakeCase((node.data as { name: string }).name)})`).join("\n")}

# Add edges
${canvasState.edges.map((edge) => `builder.add_edge("${edge.source}", "${edge.target}")`).join("\n")}

# Set entry point
builder.set_entry_point("${canvasState.entryPoint}")

# Build graph
graph = builder.build()
`;

  const mainFunction = `
def invoke(prompt: str) -> str:
    """Invoke the agent graph with a prompt."""
    result = graph(prompt)
    return result.message['content'][0]['text']


if __name__ == "__main__":
    response = invoke("Hello, how can you help me?")
    print(response)
`;

  const agentCode = agentImports + agentDefinitions + graphBuilder + mainFunction;

  // Generate agentcore_config.py
  const agentcoreCode = `"""
Amazon Bedrock AgentCore Configuration
Generated for deployment to AgentCore Runtime
"""

from bedrock_agentcore.runtime import BedrockAgentCoreApp
from agent import graph

# Initialize AgentCore App
app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context: dict) -> dict:
    """
    AgentCore Runtime entrypoint.

    Args:
        payload: Request payload containing 'prompt' key
        context: Runtime context with session info

    Returns:
        Response dict with 'response' key
    """
    prompt = payload.get("prompt", "")
    session_id = context.get("session_id", "default")

    # Invoke the agent graph
    result = graph(prompt)
    response_text = result.message['content'][0]['text']

    return {
        "response": response_text,
        "session_id": session_id,
        "metadata": {
            "pattern": "${canvasState.metadata?.pattern || "Graph Pattern"}",
            "agent_count": ${agentNodes.length}
        }
    }


# Optional: Configure Memory
# from bedrock_agentcore.memory import MemoryClient
# memory = MemoryClient()

# Optional: Configure Gateway
# from bedrock_agentcore.gateway import GatewayClient
# gateway = GatewayClient()
`;

  // Generate requirements.txt
  const requirementsCode = `# Strands Agent SDK
strands-agents>=0.1.0

# AWS Bedrock
boto3>=1.34.0
botocore>=1.34.0

# AgentCore Runtime (for deployment)
bedrock-agentcore>=0.1.0

# Utilities
python-dotenv>=1.0.0
pydantic>=2.0.0
`;

  return {
    agent: agentCode,
    agentcore: agentcoreCode,
    requirements: requirementsCode,
  };
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}
