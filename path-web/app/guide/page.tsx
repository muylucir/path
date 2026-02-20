"use client";

import Link from "next/link";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import TextContent from "@cloudscape-design/components/text-content";
import Table from "@cloudscape-design/components/table";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import AnchorNavigation from "@cloudscape-design/components/anchor-navigation";

const GUIDE_ANCHORS = [
  { text: "P.A.T.H란?", href: "#about", level: 1 },
  { text: "Step 1: Problem", href: "#step1", level: 1 },
  { text: "Step 2: Technical", href: "#step2", level: 1 },
  { text: "Step 3: Agent Pattern", href: "#step3", level: 1 },
  { text: "Step 4: Handoff", href: "#step4", level: 1 },
  { text: "활용 시나리오", href: "#scenarios", level: 1 },
  { text: "결과물 요약", href: "#results", level: 1 },
  { text: "핵심 가치", href: "#value", level: 1 },
];

export default function GuidePage() {
  return (
    <AppLayoutShell
      breadcrumbs={[{ text: "가이드", href: "/guide" }]}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "2rem" }}>
      <ContentLayout
        header={
          <Header
            variant="h1"
            description="AI Agent 아이디어를 검증하고, 개발팀이 바로 착수할 수 있는 구현 명세서를 자동 생성하는 도구"
          >
            P.A.T.H Agent Designer
          </Header>
        }
      >
        <SpaceBetween size="l">
          {/* About */}
          <div id="about">
            <Container header={<Header variant="h2">P.A.T.H란?</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    <strong>P.A.T.H</strong> = <strong>P</strong>roblem → <strong>T</strong>echnical → <strong>A</strong>gent Pattern → <strong>H</strong>andoff
                  </p>
                  <p>
                    AI Agent를 도입하려면 &ldquo;좋은 아이디어&rdquo;만으로는 부족합니다. 그 아이디어가 실현 가능한지,
                    지금 바로 시작할 수 있는 상태인지, 어떤 구조로 만들어야 하는지를 먼저 확인해야 합니다. P.A.T.H는
                    이 과정을 4단계로 안내합니다.
                  </p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "step", header: "단계", cell: (item) => <strong>{item.step}</strong>, width: 200 },
                    { id: "desc", header: "설명", cell: (item) => item.desc },
                  ]}
                  items={[
                    { step: "Step 1: Problem", desc: "문제를 구조화합니다" },
                    { step: "Step 2: Technical", desc: "준비 상태를 점검합니다" },
                    { step: "Step 3: Agent Pattern", desc: "구현 방식을 결정합니다" },
                    { step: "Step 4: Handoff", desc: "구현 명세서를 생성합니다" },
                  ]}
                />
              </SpaceBetween>
            </Container>
          </div>

          {/* Step 1 */}
          <div id="step1">
            <Container header={<Header variant="h2">Step 1: Problem — 문제 구조화</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    &ldquo;이 업무를 자동화하고 싶다&rdquo;는 요구사항을, 기획팀과 개발팀이 같은 그림을 볼 수 있도록
                    정리합니다.
                  </p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "q", header: "질문", cell: (item) => item.q, width: 250 },
                    { id: "ex", header: "예시", cell: (item) => item.ex },
                  ]}
                  items={[
                    { q: "언제 시작되는 작업인가요?", ex: "고객 요청 시, 매일 오전 9시, 특정 조건 충족 시" },
                    { q: "어떤 처리가 필요한가요?", ex: "데이터 수집, 분석/분류, 판단, 문서 생성, 검증, 실행" },
                    { q: "최종 결과물은 무엇인가요?", ex: "의사결정, 보고서, 알림, 시스템 실행, 인사이트" },
                    { q: "사람이 확인해야 하는 부분은?", ex: "없음, 최종 검토, 예외 상황만, 함께 협업" },
                  ]}
                />
                <TextContent>
                  <p>추가로 허용 가능한 오류 수준, 참고할 데이터 소스, 업무 맥락도 입력할 수 있습니다.</p>
                </TextContent>
                <Alert type="info">
                  <strong>이 단계를 거치면:</strong> 막연했던 요구사항이 구체적인 문제 정의로 바뀝니다. 기획팀이
                  &ldquo;이걸 자동화하고 싶어요&rdquo;라고 말한 것을, 개발팀이 이해할 수 있는 형태로 변환합니다.
                </Alert>
              </SpaceBetween>
            </Container>
          </div>

          {/* Step 2 */}
          <div id="step2">
            <Container header={<Header variant="h2">Step 2: Technical — 준비도 점검</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>
                    아이디어가 좋아도, 데이터가 없거나 시스템 연동이 어려우면 프로젝트가 중간에 멈춥니다. AI가 5가지
                    핵심 항목을 점검합니다.
                  </p>
                </TextContent>

                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "item", header: "항목", cell: (item) => <strong>{item.item}</strong>, width: 130 },
                    { id: "good", header: "준비됨 (8-10점)", cell: (item) => <StatusIndicator type="success">{item.good}</StatusIndicator> },
                    { id: "mid", header: "보통 (4-7점)", cell: (item) => <StatusIndicator type="warning">{item.mid}</StatusIndicator> },
                    { id: "low", header: "부족 (0-3점)", cell: (item) => <StatusIndicator type="error">{item.low}</StatusIndicator> },
                  ]}
                  items={[
                    { item: "데이터 접근성", good: "API로 바로 가져올 수 있음", mid: "DB 직접 접근 필요", low: "수기 데이터만 존재" },
                    { item: "판단 명확성", good: "명확한 규칙이 정리됨", mid: "경험적으로 알지만 문서화 안 됨", low: "담당자의 감에 의존" },
                    { item: "오류 허용도", good: "틀려도 업무에 큰 지장 없음", mid: "90% 이상 정확해야 함", low: "반드시 100% 정확해야 함" },
                    { item: "응답 시간", good: "몇 시간 걸려도 괜찮음", mid: "1분 이내 응답 필요", low: "3초 이내 실시간 필요" },
                    { item: "시스템 연동", good: "독립적으로 실행 가능", mid: "3~5개 시스템과 연결 필요", low: "레거시 시스템에 의존" },
                  ]}
                />

                {/* Score Grid */}
                <Header variant="h3">종합 판정 (총 50점)</Header>
                <ColumnLayout columns={4}>
                  <Container>
                    <Box textAlign="center">
                      <Box variant="h3" color="text-status-success">40 – 50</Box>
                      <Box fontWeight="bold">즉시 시작 가능</Box>
                      <Box variant="small" color="text-body-secondary">프로토타입 개발을 바로 시작할 수 있습니다</Box>
                    </Box>
                  </Container>
                  <Container>
                    <Box textAlign="center">
                      <Box variant="h3" color="text-status-warning">30 – 40</Box>
                      <Box fontWeight="bold">조건부 진행</Box>
                      <Box variant="small" color="text-body-secondary">시작할 수 있지만 리스크 관리가 필요합니다</Box>
                    </Box>
                  </Container>
                  <Container>
                    <Box textAlign="center">
                      <Box variant="h3" color="text-status-error">20 – 30</Box>
                      <Box fontWeight="bold">보완 후 재평가</Box>
                      <Box variant="small" color="text-body-secondary">낮은 항목을 보완한 뒤 다시 점검하세요</Box>
                    </Box>
                  </Container>
                  <Container>
                    <Box textAlign="center">
                      <Box variant="h3" color="text-body-secondary">0 – 20</Box>
                      <Box fontWeight="bold">재검토 필요</Box>
                      <Box variant="small" color="text-body-secondary">현재 상태로는 어렵습니다. 다른 접근을 고려하세요</Box>
                    </Box>
                  </Container>
                </ColumnLayout>

                <Header variant="h3">재평가</Header>
                <TextContent>
                  <p>점수가 낮은 항목에 개선 계획을 입력하면, 그 계획이 반영된 점수를 다시 받을 수 있습니다.</p>
                </TextContent>
                <Alert type="info" header="예시">
                  데이터 접근성 4점 → 개선 계획: &ldquo;ERP 시스템에 조회 API를 개발할 예정&rdquo; → 재평가: 7점으로 상향
                </Alert>
                <Alert type="success">
                  <strong>이 단계를 거치면:</strong> 개발 2주차에 발견할 문제를 프로젝트 시작 전에 파악할 수 있습니다.
                </Alert>
              </SpaceBetween>
            </Container>
          </div>

          {/* Step 3 */}
          <div id="step3">
            <Container header={<Header variant="h2">Step 3: Agent Pattern — 구현 방식 결정</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>준비도 결과를 바탕으로, AI가 적합한 Agent 구조를 추천합니다.</p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "type", header: "구조", cell: (item) => <strong>{item.type}</strong>, width: 150 },
                    { id: "fit", header: "적합한 경우", cell: (item) => item.fit },
                    { id: "example", header: "예시", cell: (item) => item.example },
                  ]}
                  items={[
                    { type: "단계적 추론형", fit: "정보를 모아서 판단해야 하는 업무", example: "고객 문의 분석 → 답변 생성" },
                    { type: "자가 검토형", fit: "결과물의 품질이 중요한 업무", example: "보고서 작성 후 스스로 검토/수정" },
                    { type: "도구 활용형", fit: "외부 시스템을 조회하거나 실행해야 하는 업무", example: "DB 조회, API 호출, 파일 처리" },
                    { type: "계획 수립형", fit: "여러 단계를 순서대로 처리해야 하는 업무", example: "다단계 승인 프로세스" },
                    { type: "다중 Agent 협업형", fit: "역할을 나눠야 할 만큼 복잡한 업무", example: "분석 + 작성 + 검수를 각각 담당" },
                    { type: "사람 검토 포함형", fit: "최종 판단에 사람이 필요한 업무", example: "법무/재무 검토가 포함된 프로세스" },
                  ]}
                />
                <TextContent>
                  <p>추천 후에는 AI와 대화하며 결정을 다듬을 수 있습니다.</p>
                  <ul>
                    <li>&ldquo;우리 업무는 실시간 처리가 중요한데, 이 방식이 맞나요?&rdquo;</li>
                    <li>&ldquo;Agent를 여러 개 쓰는 게 왜 필요한 건가요?&rdquo;</li>
                    <li>&ldquo;더 단순한 방식으로는 안 되나요?&rdquo;</li>
                  </ul>
                </TextContent>
                <Alert type="success">
                  <strong>이 단계를 거치면:</strong> &ldquo;어떤 방식으로 만들 것인가&rdquo;에 대한 기술적 결정이 내려지고, 그 이유도 함께 정리됩니다.
                </Alert>
              </SpaceBetween>
            </Container>
          </div>

          {/* Step 4 */}
          <div id="step4">
            <Container header={<Header variant="h2">Step 4: Handoff — 구현 명세서 생성</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p>4개의 전문 AI가 순차적으로 명세서를 작성합니다.</p>
                </TextContent>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "order", header: "순서", cell: (item) => item.order, width: 80 },
                    { id: "content", header: "작성 내용", cell: (item) => item.content },
                  ]}
                  items={[
                    { order: "1단계", content: "Agent 구조 설계 — 역할 분담, 처리 흐름, 상태 관리" },
                    { order: "2단계", content: "아키텍처 다이어그램 — 시각적 처리 흐름도" },
                    { order: "3단계", content: "구현 세부사항 — 프롬프트 설계, 도구 정의, 입출력 스펙" },
                    { order: "4단계", content: "최종 문서 통합 — 하나의 명세서로 조합" },
                  ]}
                />

                <Header variant="h3">명세서에 포함되는 내용</Header>
                <Table
                  variant="embedded"
                  columnDefinitions={[
                    { id: "section", header: "섹션", cell: (item) => <strong>{item.section}</strong>, width: 180 },
                    { id: "desc", header: "설명", cell: (item) => item.desc },
                  ]}
                  items={[
                    { section: "요약", desc: "프로젝트 개요, 핵심 결정 사항" },
                    { section: "Agent 설계", desc: "선택된 구조와 선택 이유" },
                    { section: "역할 정의", desc: "Agent별 담당 업무와 책임 범위" },
                    { section: "처리 흐름", desc: "입력부터 출력까지의 단계별 흐름" },
                    { section: "아키텍처 다이어그램", desc: "시각적 구조도" },
                    { section: "구현 가이드", desc: "개발팀이 참고할 기술 세부사항" },
                  ]}
                />
                <Alert type="success">
                  <strong>이 단계를 거치면:</strong> 기획서에 첨부하거나, 개발팀에 바로 전달하거나, 외부 개발사에
                  요구사항으로 보낼 수 있는 문서가 만들어집니다.
                </Alert>
              </SpaceBetween>
            </Container>
          </div>

          {/* Scenarios */}
          <div id="scenarios">
            <Container header={<Header variant="h2">활용 시나리오</Header>}>
              <SpaceBetween size="m">
                {[
                  {
                    title: "기획팀과 개발팀의 킥오프",
                    situation: "기획팀이 \"고객 문의 자동 분류\"를 요청, 개발팀은 구체적인 요구사항을 모름",
                    without: "개발 2주차에 \"분류 기준이 뭐죠?\" → 재작업, 일정 지연",
                    withPath: "킥오프에서 판단 명확성 5점 확인, 기준 정리 먼저 진행 → 준비된 상태에서 개발 시작",
                  },
                  {
                    title: "자동화 후보 우선순위 결정",
                    situation: "3개 업무 중 어떤 것을 먼저 자동화할지 결정해야 함",
                    without: "\"이게 효과가 클 것 같다\" (감) → 가장 어려운 것부터 시작해서 좌초",
                    withPath: "준비도 42점 / 28점 / 38점 비교 → 실현 가능성 높은 것부터 성과 축적",
                  },
                  {
                    title: "경영진 PoC 제안",
                    situation: "AI Agent PoC 기획서를 경영진에게 보고해야 함",
                    without: "\"AI가 자동으로 처리합니다\" → \"구체적으로 어떻게?\" → 추가 질문 반복",
                    withPath: "아키텍처 다이어그램 + 역할 정의 + 처리 흐름 첨부 → 한 번에 승인",
                  },
                  {
                    title: "외주 개발사에 요구사항 전달",
                    situation: "AI Agent 개발을 외부에 맡기려는데 요구사항 정의가 어려움",
                    without: "\"AI로 문서 분석하는 것 만들어주세요\" → 기대와 다른 결과물",
                    withPath: "구현 명세서 전달 (구조, 입출력, 흐름) → 요구사항에 부합하는 결과물",
                  },
                ].map((s) => (
                  <ExpandableSection key={s.title} headerText={s.title}>
                    <SpaceBetween size="s">
                      <Box variant="p"><strong>상황:</strong> {s.situation}</Box>
                      <ColumnLayout columns={2}>
                        <Container>
                          <Box variant="awsui-key-label">P.A.T.H 없이</Box>
                          <Box variant="p" color="text-body-secondary">{s.without}</Box>
                        </Container>
                        <Container>
                          <Box variant="awsui-key-label">P.A.T.H 활용</Box>
                          <Box variant="p">{s.withPath}</Box>
                        </Container>
                      </ColumnLayout>
                    </SpaceBetween>
                  </ExpandableSection>
                ))}
              </SpaceBetween>
            </Container>
          </div>

          {/* Results */}
          <div id="results">
            <Container header={<Header variant="h2">결과물 요약</Header>}>
              <Table
                variant="embedded"
                columnDefinitions={[
                  { id: "result", header: "결과물", cell: (item) => <strong>{item.result}</strong>, width: 220 },
                  { id: "who", header: "누가, 어디에 쓰는가", cell: (item) => item.who },
                ]}
                items={[
                  { result: "준비도 점수 (50점 만점)", who: "프로젝트 매니저 — Go/No-Go 판단 근거" },
                  { result: "항목별 진단 + 개선 방향", who: "기획팀 — 사전 준비 항목 도출" },
                  { result: "리스크 목록", who: "프로젝트 전체 — 착수 전 위험 공유" },
                  { result: "Agent 구조 추천 + 근거", who: "개발팀 — 아키텍처 설계 출발점" },
                  { result: "구현 명세서 (다이어그램 포함)", who: "개발팀/외주사 — 개발 착수 문서, PoC 기획서 첨부" },
                ]}
              />
            </Container>
          </div>

          {/* Value */}
          <div id="value">
            <Container header={<Header variant="h2">P.A.T.H의 핵심 가치</Header>}>
              <SpaceBetween size="m">
                <TextContent>
                  <p><strong>만들기 전에, 만들 수 있는지 확인한다.</strong></p>
                  <p><strong>만들 수 있다면, 어떻게 만들어야 하는지 정리한다.</strong></p>
                  <p><strong>정리가 끝나면, 바로 시작할 수 있는 문서를 만든다.</strong></p>
                  <ul>
                    <li>개발 착수 후 발견할 문제를 <strong>사전에</strong> 발견합니다</li>
                    <li>기획자와 개발팀이 <strong>같은 언어</strong>로 대화할 수 있게 합니다</li>
                    <li>아이디어에서 구현 계획까지의 <strong>간극을 메웁니다</strong></li>
                  </ul>
                </TextContent>
                <Box textAlign="center">
                  <Link href="/intro" style={{ textDecoration: "none" }}>
                    <Button variant="link" iconName="arrow-left" iconAlign="left">
                      P.A.T.H 소개 보기
                    </Button>
                  </Link>
                </Box>
              </SpaceBetween>
            </Container>
          </div>
        </SpaceBetween>
      </ContentLayout>
      <div style={{ position: "sticky", top: 56, alignSelf: "start" }}>
        <AnchorNavigation anchors={GUIDE_ANCHORS} />
      </div>
      </div>
    </AppLayoutShell>
  );
}
