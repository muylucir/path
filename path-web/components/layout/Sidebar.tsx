"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SessionList } from "@/components/sessions/SessionList";
import { ChevronDown } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-80 border-r p-6 space-y-4 overflow-y-auto h-[calc(100vh-73px)]">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">💾 세션 관리</h2>
        <SessionList />
      </div>

      <div className="border-t pt-4 space-y-2">
        <h2 className="text-lg font-semibold">📚 P.A.T.H 프레임워크</h2>
        
        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <span className="text-sm font-medium">💡 P.A.T.H 프레임워크?</span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pt-2 text-sm text-muted-foreground space-y-2">
            <p><strong>P.A.T.H</strong> = Problem → Agent Pattern → Technical → Handoff</p>
            <p>AI Agent 아이디어를 <strong>프로토타입으로 검증</strong>하는 구조화된 방법론입니다.</p>
            <div className="mt-2">
              <p className="font-medium text-foreground">목표:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>막연한 아이디어를 구조화</li>
                <li>실현 가능성 정량 평가</li>
                <li>코딩 전 실패 가능성 조기 발견</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <span className="text-sm font-medium">🔍 P: Problem Decomposition</span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pt-2 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Pain Point를 4가지 요소로 분해:</p>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-foreground">1. INPUT</p>
                <p className="text-xs">무엇이 트리거인가?</p>
                <p className="text-xs">Event-Driven, Scheduled, On-Demand, Streaming, Conditional</p>
              </div>
              <div>
                <p className="font-medium text-foreground">2. PROCESS</p>
                <p className="text-xs">무슨 작업이 필요한가?</p>
                <p className="text-xs">데이터 수집, 분석/분류, 판단/평가, 콘텐츠 생성, 검증/개선, 실행/연동</p>
              </div>
              <div>
                <p className="font-medium text-foreground">3. OUTPUT</p>
                <p className="text-xs">결과물은 무엇인가?</p>
                <p className="text-xs">Decision, Content, Notification, Action, Insight</p>
              </div>
              <div>
                <p className="font-medium text-foreground">4. HUMAN-IN-LOOP</p>
                <p className="text-xs">사람 개입 시점은?</p>
                <p className="text-xs">None, Review, Exception, Collaborate</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <span className="text-sm font-medium">🎯 A: Agent Pattern Mapping</span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pt-2 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Andrew Ng의 4가지 패턴:</p>
            <div className="space-y-2">
              <div>
                <p className="font-medium text-foreground">• Reflection</p>
                <p className="text-xs">품질 검증 후 개선</p>
                <p className="text-xs">예: 코드 생성, 제안서 작성</p>
              </div>
              <div>
                <p className="font-medium text-foreground">• Tool Use</p>
                <p className="text-xs">외부 도구/API 호출</p>
                <p className="text-xs">예: 웹 검색, DB 조회, 계산</p>
              </div>
              <div>
                <p className="font-medium text-foreground">• Planning</p>
                <p className="text-xs">단계별 분해 실행</p>
                <p className="text-xs">예: 여행 계획, 보고서 작성</p>
              </div>
              <div>
                <p className="font-medium text-foreground">• Multi-Agent</p>
                <p className="text-xs">여러 에이전트 협업</p>
                <p className="text-xs">예: 시장 조사, 코드 리뷰</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <span className="text-sm font-medium">📊 T: Technical Feasibility</span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pt-2 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">5개 항목 평가 (총 50점):</p>
            <div className="space-y-1 text-xs">
              <p>1. <strong>데이터 접근성</strong> (10점)</p>
              <p className="ml-4">MCP 서버 → API → 파일 → DB → 스크래핑</p>
              <p>2. <strong>판단 기준 명확성</strong> (10점)</p>
              <p className="ml-4">명확한 규칙 → 예시 많음 → 직감</p>
              <p>3. <strong>오류 허용도</strong> (10점)</p>
              <p className="ml-4">틀려도 OK → 리뷰 → 90%+ 필요</p>
              <p>4. <strong>지연 요구사항</strong> (10점)</p>
              <p className="ml-4">몇 시간 → 몇 분 → 실시간</p>
              <p>5. <strong>통합 복잡도</strong> (10점)</p>
              <p className="ml-4">독립 실행 → 1-2개 → 레거시</p>
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <p className="font-medium text-foreground">판정:</p>
              <p>• 40-50점: ✅ 즉시 시작</p>
              <p>• 30-40점: ⚠️ 조건부</p>
              <p>• 20-30점: 🔄 개선 필요</p>
              <p>• 20점 미만: ❌ 대안 모색</p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-md">
            <span className="text-sm font-medium">📋 H: Handoff Specification</span>
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="px-2 pt-2 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">최종 산출물:</p>
            <ul className="list-disc list-inside space-y-1 text-xs ml-2">
              <li>구현 명세서 (Markdown)</li>
              <li>Architecture 다이어그램</li>
              <li>Agent 컴포넌트 정의</li>
              <li>Risk & Mitigation</li>
              <li>Success Metrics</li>
            </ul>
            <p className="text-xs mt-2">→ 개발팀에 전달하여 프로토타입 구현</p>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          💡 Tip: 각 단계를 신중히 작성하면 더 정확한 분석이 가능합니다.
        </p>
      </div>
    </aside>
  );
}
