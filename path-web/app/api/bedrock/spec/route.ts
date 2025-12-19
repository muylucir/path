import { invokeClaudeStream } from "@/lib/aws/bedrock";
import { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { analysis } = await req.json();

    const systemPrompt = `당신은 20년차 소프트웨어 아키텍트이자 AI Agent 전문가 그리고 P.A.T.H (Problem-Agent-Technical-Handoff) 프레임워크를 개발한 전문가입니다.`;

    const prompt = `다음 분석 결과를 바탕으로 프로토타입 구현을 위한 명세서를 작성하세요:

${JSON.stringify(analysis, null, 2)}

다음 5개 섹션만 작성하세요:

# AI Agent Design Specification

## 1. Executive Summary
- **Problem**: 해결하려는 문제 (1-2문장)
- **Solution**: 선택된 패턴과 접근 방법
- **Feasibility Score**: X/50 (판정)
- **Go/No-Go**: 추천 사항

## 2. Problem Decomposition
### INPUT
- 트리거 타입과 상세 설명
- 데이터 소스

### PROCESS
- 각 단계별 상세 설명 (번호 매겨서)

### OUTPUT
- 결과물 타입과 형식
- 전달 방법

### Human-in-Loop
- 사람 개입 시점과 방법

## 3. Architecture

### 3.1 System Architecture
\`\`\`mermaid
graph TB
    [전체 시스템 구조]
\`\`\`

### 3.2 Sequence Diagram
\`\`\`mermaid
sequenceDiagram
    [컴포넌트 간 상호작용]
\`\`\`

### 3.3 Flow Chart
\`\`\`mermaid
flowchart TD
    [처리 흐름]
\`\`\`

## 4. Agent Components

선택된 패턴에 맞게 작성하세요:

| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|

## 5. Technical Stack
- **Framework**:
    - 이유: 
- **LLM**: 
    - 용도: 
    - 이유: 

---

**중요1**: 위 5개 섹션만 작성하세요.
**중요2**: LLM은 Claude Opus 4.5, Sonnet 4.5, Haiku 4.5 중에서만 선택하세요.
**중요3**: Framework는 Strands SDK를 사용하세요.`;

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
