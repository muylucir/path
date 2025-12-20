import { invokeClaudeStream } from "@/lib/aws/bedrock";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { analysis, useAgentCore } = await req.json();

    const systemPrompt = `당신은 20년차 소프트웨어 아키텍트이자 AI Agent 전문가 그리고 P.A.T.H (Problem-Agent-Technical-Handoff) 프레임워크를 개발한 전문가입니다.`;

    const prompt = useAgentCore ? getAgentCoreSpecPrompt(analysis) : `다음 분석 결과를 바탕으로 Strands Agent 기반 구현 명세서를 작성하세요:

${JSON.stringify(analysis, null, 2)}

# AI Agent Design Specification

## 1. Executive Summary
- **Problem**: 해결하려는 문제 (1문장)
- **Solution**: Strands Agent 구현 방법 (1-2문장)
- **Feasibility**: X/50 (판정)

## 2. Strands Agent 구현

### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|

### 패턴 분석
선택된 패턴과 Strands Agent 구현 방법:
- [패턴명]: [Graph 구조 설명 1-2문장]

### Graph 구조
\`\`\`python
nodes = {"node1": Agent(role="...", goal="...")}
edges = [("node1", "node2")]
\`\`\`

### Agent-as-Tool
| Agent Name | Role | Input | Output | 사용 시점 |
|------------|------|-------|--------|----------|

### Invocation State 활용
에이전트 간 상태 공유:
- **용도**: [어떤 데이터를 공유할지]
- **업데이트 시점**: [언제 상태를 업데이트할지]
- **활용 방법**: [다음 노드에서 어떻게 사용할지]

### MCP 연동
- [MCP 서버명]: [용도]

## 3. Architecture

\`\`\`mermaid
graph TB
    [Strands Graph 구조]
\`\`\`

\`\`\`mermaid
sequenceDiagram
    [핵심 흐름만]
\`\`\`

\`\`\`mermaid
flowchart TD
    [처리 흐름]
\`\`\`

## 4. Problem Decomposition
- INPUT: [트리거]
- PROCESS: [핵심 단계만 3-5개]
- OUTPUT: [결과물]
- Human-in-Loop: [개입 시점]

---
**중요1**: 패턴 분석에서 선택된 패턴과 Graph 구조를 명확히 설명하세요.
**중요2**: Invocation State로 에이전트 간 데이터를 공유하는 방법을 구체적으로 작성하세요.
**중요3**: 구현 코드는 핵심 노드만 간결하게 작성하세요.
**중요4**: LLM은 Claude Sonnet 4.5, Haiku 4.5 중에서만 선택하세요.
**중요5**: 다이어그램은 Strands Agent 아키텍처에 맞게 작성하세요.
**중요6**: 위 4개 섹션만 작성하고, 구현 계획이나 일정은 포함하지 마세요.`;

function getAgentCoreSpecPrompt(analysis: any): string {
  return `다음 분석 결과를 바탕으로 Strands Agent 기반 구현 명세서를 작성하세요:

${JSON.stringify(analysis, null, 2)}

# AI Agent Design Specification

## 1. Executive Summary
- **Problem**: 해결하려는 문제 (1문장)
- **Solution**: Strands Agent 구현 방법 (1-2문장)
- **Feasibility**: X/50 (판정)

## 2. Strands Agent 구현

### Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|

### 패턴 분석
선택된 패턴과 Strands Agent 구현 방법:
- [패턴명]: [Graph 구조 설명 1-2문장]

### Graph 구조
\`\`\`python
nodes = {"node1": Agent(role="...", goal="...")}
edges = [("node1", "node2")]
\`\`\`

### Agent-as-Tool
| Agent Name | Role | Input | Output | 사용 시점 |
|------------|------|-------|--------|----------|

### Invocation State 활용
에이전트 간 상태 공유:
- **용도**: [어떤 데이터를 공유할지]
- **업데이트 시점**: [언제 상태를 업데이트할지]
- **활용 방법**: [다음 노드에서 어떻게 사용할지]

### MCP 연동
- [MCP 서버명]: [용도]

## 3. Architecture

\`\`\`mermaid
graph TB
    [Strands Graph 구조]
\`\`\`

\`\`\`mermaid
sequenceDiagram
    [핵심 흐름만]
\`\`\`

\`\`\`mermaid
flowchart TD
    [처리 흐름]
\`\`\`

## 4. Problem Decomposition
- INPUT: [트리거]
- PROCESS: [핵심 단계만 3-5개]
- OUTPUT: [결과물]
- Human-in-Loop: [개입 시점]

---
**중요1**: 패턴 분석에서 선택된 패턴과 Graph 구조를 명확히 설명하세요.
**중요2**: Invocation State로 에이전트 간 데이터를 공유하는 방법을 구체적으로 작성하세요.
**중요3**: 구현 코드는 핵심 노드만 간결하게 작성하세요.
**중요4**: LLM은 Claude Sonnet 4.5, Haiku 4.5 중에서만 선택하세요.
**중요5**: 다이어그램은 Strands Agent 아키텍처에 맞게 작성하세요.
**중요6**: 위 4개 섹션만 작성하고, 구현 계획이나 일정은 포함하지 마세요.
**중요7**: 분석된 요구사항에 맞게 AgentCore 서비스(Runtime/Memory/Gateway/Identity/Browser/Code Interpreter) 중 필요한 것을 선택하고 활용 방법을 구체적으로 설명하세요.`;
}

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of invokeClaudeStream(prompt, systemPrompt)) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Error in spec stream:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Error in spec API:", error);
    return new Response(
      JSON.stringify({ 
        error: "명세서 생성 중 오류가 발생했습니다",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
