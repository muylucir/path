import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, Target, BarChart3, FileText } from "lucide-react";

export default function FrameworkPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">P.A.T.H 프레임워크</h1>
          <p className="text-muted-foreground">
            AI Agent 아이디어를 프로토타입으로 검증하는 구조화된 방법론
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-6 w-6" />
                P: Problem Decomposition
              </CardTitle>
              <CardDescription>문제를 4가지 요소로 분해</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. INPUT (트리거)</h4>
                <p className="text-sm text-muted-foreground">
                  무엇이 트리거인가? Event-Driven, Scheduled, On-Demand, Streaming, Conditional
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. PROCESS (작업)</h4>
                <p className="text-sm text-muted-foreground">
                  무슨 작업이 필요한가? 데이터 수집, 분석/분류, 판단/평가, 콘텐츠 생성, 검증/개선, 실행/연동
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. OUTPUT (결과물)</h4>
                <p className="text-sm text-muted-foreground">
                  결과물은 무엇인가? Decision, Content, Notification, Action, Insight
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. HUMAN-IN-LOOP (사람 개입)</h4>
                <p className="text-sm text-muted-foreground">
                  사람 개입 시점은? None, Review, Exception, Collaborate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6" />
                A: Agent Pattern Mapping
              </CardTitle>
              <CardDescription>적합한 패턴 선택</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Reflection</h4>
                <p className="text-sm text-muted-foreground">
                  품질 검증 후 자가 개선 (예: 코드 생성, 제안서 작성)
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Tool Use</h4>
                <p className="text-sm text-muted-foreground">
                  외부 도구/API 호출 (예: 웹 검색, DB 조회, 계산)
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Planning</h4>
                <p className="text-sm text-muted-foreground">
                  단계별 분해 실행 (예: 여행 계획, 보고서 작성)
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Multi-Agent</h4>
                <p className="text-sm text-muted-foreground">
                  여러 에이전트 협업 (예: 시장 조사, 코드 리뷰)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                T: Technical Feasibility
              </CardTitle>
              <CardDescription>5개 항목 50점 만점 평가</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">데이터 접근성 (10점)</p>
                  <p className="text-muted-foreground">MCP 서버 = RAG → API → 파일 → DB → 스크래핑</p>
                </div>
                <div>
                  <p className="font-semibold">판단 기준 명확성 (10점)</p>
                  <p className="text-muted-foreground">명확한 규칙 → 예시 많음 → 직감</p>
                </div>
                <div>
                  <p className="font-semibold">오류 허용도 (10점)</p>
                  <p className="text-muted-foreground">틀려도 OK → 리뷰 → 90%+ 필요</p>
                </div>
                <div>
                  <p className="font-semibold">지연 요구사항 (10점)</p>
                  <p className="text-muted-foreground">몇 시간 → 몇 분 → 실시간</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold">통합 복잡도 (10점)</p>
                  <p className="text-muted-foreground">독립 실행 → 1-2개 → 레거시</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <p className="font-semibold">판정 기준:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• 40-50점: 즉시 프로토타입 시작</li>
                  <li>• 30-40점: 조건부 진행 (리스크 관리)</li>
                  <li>• 20-30점: 개선 후 재평가</li>
                  <li>• 20점 미만: 대안 모색</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                H: Handoff Specification
              </CardTitle>
              <CardDescription>구현 명세서 자동 생성</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Executive Summary</li>
                <li>• Problem Decomposition</li>
                <li>• Architecture (시퀀스 다이어그램, 플로우차트)</li>
                <li>• Agent Components</li>
                <li>• Technical Stack</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                → 개발팀에 전달하여 프로토타입 구현
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
