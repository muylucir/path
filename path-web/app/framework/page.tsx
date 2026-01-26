import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Search, Target, BarChart3, FileText, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function FrameworkPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">P.A.T.H 프레임워크</h1>
          <p className="text-muted-foreground">
            AI Agent 아이디어를 프로토타입으로 검증하는 구조화된 방법론
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Problem → Agent Pattern → Technical Readiness → Handoff
          </p>
        </div>

        {/* Flow Overview */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {[
            { step: "P", label: "문제 분해", color: "bg-blue-100 text-blue-800" },
            { step: "A", label: "패턴 매핑", color: "bg-purple-100 text-purple-800" },
            { step: "T", label: "준비도 점검", color: "bg-amber-100 text-amber-800" },
            { step: "H", label: "명세서 생성", color: "bg-green-100 text-green-800" },
          ].map((item, idx) => (
            <div key={item.step} className="flex items-center gap-2">
              <Badge variant="outline" className={`${item.color} px-3 py-1 text-sm font-semibold`}>
                {item.step}: {item.label}
              </Badge>
              {idx < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {/* P: Problem Decomposition */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-6 w-6 text-blue-600" />
                P: Problem Decomposition
              </CardTitle>
              <CardDescription>Agent가 해결할 문제를 4가지 요소로 분해</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">1</span>
                    INPUT (트리거)
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    무엇이 Agent를 시작시키는가?
                  </p>
                  <div className="ml-8 flex flex-wrap gap-1">
                    {["Event-Driven", "Scheduled", "On-Demand", "Streaming"].map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">2</span>
                    PROCESS (작업)
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    어떤 작업이 필요한가?
                  </p>
                  <div className="ml-8 flex flex-wrap gap-1">
                    {["정보 수집", "분석/분류", "판단/결정", "생성/작성", "검증/반복"].map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">3</span>
                    OUTPUT (결과물)
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    최종 결과물은 무엇인가?
                  </p>
                  <div className="ml-8 flex flex-wrap gap-1">
                    {["텍스트 응답", "문서/보고서", "구조화된 데이터", "시스템 변경"].map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center justify-center font-bold">4</span>
                    HUMAN-IN-LOOP (사람 개입)
                  </h4>
                  <p className="text-sm text-muted-foreground ml-8">
                    사람의 개입이 필요한 시점은?
                  </p>
                  <div className="ml-8 flex flex-wrap gap-1">
                    {["완전 자동", "실행 전 승인", "예외 시 개입", "협업"].map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* A: Agent Pattern Mapping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-purple-600" />
                A: Agent Pattern Mapping
              </CardTitle>
              <CardDescription>문제 특성에 맞는 Agent 아키텍처 패턴 선택</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-purple-700">Reflection Pattern</h4>
                  <p className="text-sm text-muted-foreground">
                    결과물을 스스로 검토하고 개선하는 자가 반복 구조
                  </p>
                  <p className="text-xs text-muted-foreground">
                    예: 코드 생성 후 테스트 → 오류 수정, 제안서 작성 → 품질 검토 → 개선
                  </p>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-purple-700">Tool Use Pattern</h4>
                  <p className="text-sm text-muted-foreground">
                    외부 도구와 API를 활용하여 작업 수행
                  </p>
                  <p className="text-xs text-muted-foreground">
                    예: 웹 검색, DB 조회, 계산기, 외부 API 호출
                  </p>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-purple-700">Planning Pattern</h4>
                  <p className="text-sm text-muted-foreground">
                    복잡한 작업을 단계별로 분해하여 순차 실행
                  </p>
                  <p className="text-xs text-muted-foreground">
                    예: 여행 계획 수립, 프로젝트 일정 생성, 복잡한 보고서 작성
                  </p>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-purple-700">Multi-Agent Pattern</h4>
                  <p className="text-sm text-muted-foreground">
                    여러 전문 Agent가 역할을 분담하여 협업
                  </p>
                  <p className="text-xs text-muted-foreground">
                    예: 코드 리뷰 (작성자 + 검토자), 토론 시뮬레이션
                  </p>
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  <strong>패턴 조합:</strong> 실제 Agent는 여러 패턴을 조합합니다.
                  예를 들어, Tool Use + Reflection으로 데이터를 조회하고 결과를 검증하는 구조가 일반적입니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* T: Technical Readiness */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-amber-600" />
                T: Technical Readiness
              </CardTitle>
              <CardDescription>5개 항목 50점 만점 준비도 점검</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">데이터 접근성</p>
                    <Badge variant="outline" className="text-xs">10점</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    필요한 데이터에 접근 가능한가?
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">API/MCP 존재 → RAG → 스크래핑</span>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">판단 명확성</p>
                    <Badge variant="outline" className="text-xs">10점</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    판단 기준이 명확한가?
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">규칙화 가능 → 예시 다수 → 암묵지</span>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">오류 허용도</p>
                    <Badge variant="outline" className="text-xs">10점</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    실수가 발생하면 얼마나 치명적인가?
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">틀려도 OK → 검토 후 실행 → 99%+ 필요</span>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">지연 요구사항</p>
                    <Badge variant="outline" className="text-xs">10점</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    얼마나 빠른 응답이 필요한가?
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">배치 → 몇 분 → 실시간</span>
                  </div>
                </div>
                <div className="border rounded-lg p-3 space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">통합 복잡도</p>
                    <Badge variant="outline" className="text-xs">10점</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    연동해야 할 시스템이 얼마나 복잡한가?
                  </p>
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span className="text-muted-foreground">독립 실행 → 1-2개 연동 → 레거시 시스템</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="font-semibold text-sm">준비도 레벨</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 rounded bg-green-50 border border-green-200">
                    <span>✅</span>
                    <div>
                      <p className="font-medium text-green-800">준비됨</p>
                      <p className="text-xs text-green-600">8-10점</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-blue-50 border border-blue-200">
                    <span>🔵</span>
                    <div>
                      <p className="font-medium text-blue-800">양호</p>
                      <p className="text-xs text-blue-600">6-7점</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-yellow-50 border border-yellow-200">
                    <span>🟡</span>
                    <div>
                      <p className="font-medium text-yellow-800">보완 필요</p>
                      <p className="text-xs text-yellow-600">4-5점</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-orange-50 border border-orange-200">
                    <span>🟠</span>
                    <div>
                      <p className="font-medium text-orange-800">준비 필요</p>
                      <p className="text-xs text-orange-600">0-3점</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">준비도 향상 방법</p>
                    <p className="text-xs text-amber-700">
                      낮은 점수 항목에 대해 개선 계획을 입력하면 재평가 시 반영됩니다.
                      예: 데이터 접근성이 낮으면 API 개발 계획, 판단 명확성이 낮으면 예시 데이터 수집 계획 등
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* H: Handoff Specification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-green-600" />
                H: Handoff Specification
              </CardTitle>
              <CardDescription>개발팀에 전달할 구현 명세서 자동 생성</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2 border rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-sm">Executive Summary</span>
                    <p className="text-xs text-muted-foreground">Agent 목적과 핵심 기능 요약</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 border rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-sm">Problem Decomposition</span>
                    <p className="text-xs text-muted-foreground">INPUT/PROCESS/OUTPUT/HUMAN 분석 결과</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 border rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-sm">Architecture</span>
                    <p className="text-xs text-muted-foreground">시퀀스 다이어그램, 플로우차트 (Mermaid)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 border rounded-lg p-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-sm">Agent Components</span>
                    <p className="text-xs text-muted-foreground">Tool 정의, 프롬프트, 에러 처리</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Flow Note */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">앱 실행 흐름</p>
            <p>
              P.A.T.H 프레임워크의 개념적 순서는 P → A → T → H이지만,
              실제 앱에서는 실용성을 위해 <strong>P (기본 정보) → T (준비도 점검) → A (패턴 분석) → H (명세서)</strong> 순서로 진행됩니다.
              준비도를 먼저 점검하여 실현 가능성을 확인한 후, 패턴 분석을 진행합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
