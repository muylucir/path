import { invokeClaude } from "@/lib/aws/bedrock";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { NextRequest } from "next/server";

export const maxDuration = 60; // 60 seconds timeout

export async function POST(req: NextRequest) {
  try {
    const { conversation } = await req.json();

    // Build conversation context
    const conversationText = conversation
      .map((msg: { role: string; content: string }) => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      )
      .join("\n\n");

    const prompt = `다음은 지금까지의 분석 내용입니다:

${conversationText}

이제 최종 분석을 수행하세요. 다음을 JSON 형식으로 출력:

{
  "pain_point": "사용자 Pain Point",
  "input_type": "INPUT 타입",
  "input_detail": "INPUT 상세",
  "process_steps": ["단계1: 설명", "단계2: 설명", "..."],
  "output_types": ["OUTPUT 타입1", "OUTPUT 타입2"],
  "output_detail": "OUTPUT 상세",
  "human_loop": "None/Review/Exception/Collaborate",
  "pattern": "Reflection/Tool Use/Planning/Multi-Agent",
  "pattern_reason": "패턴 선택 이유",
  "feasibility_breakdown": {
    "data_access": 0-10,
    "decision_clarity": 0-10,
    "error_tolerance": 0-10,
    "latency": 0-10,
    "integration": 0-10
  },
  "feasibility_score": 0-50,
  "recommendation": "추천 사항",
  "risks": ["리스크1", "리스크2"],
  "next_steps": [
    "Phase 1: 핵심 기능 프로토타입 - 설명",
    "Phase 2: 검증 및 테스트 - 설명",
    "Phase 3: (선택적) 개선 및 확장 - 설명"
  ]
}

중요: next_steps는 주 단위 기간이 아닌 Phase/단계 중심으로 작성하세요.
JSON만 출력하세요.`;

    const systemPromptForJson = `${SYSTEM_PROMPT}

당신은 지금까지의 대화를 바탕으로 최종 분석을 수행하고 JSON 형식으로 출력합니다.
간결하고 정확하게 작성하세요.`;

    const response = await invokeClaude(prompt, systemPromptForJson);

    // Extract JSON from response
    const jsonStart = response.indexOf("{");
    const jsonEnd = response.lastIndexOf("}") + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      const jsonStr = response.substring(jsonStart, jsonEnd);
      const analysis = JSON.parse(jsonStr);
      return Response.json(analysis);
    } else {
      throw new Error("JSON을 찾을 수 없습니다");
    }
  } catch (error) {
    console.error("Error in finalize API:", error);
    return new Response(
      JSON.stringify({ error: "최종 분석 중 오류가 발생했습니다" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
