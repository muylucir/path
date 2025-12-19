# P.A.T.H Agent Designer - 아이디어 문서

## 1️⃣ 아이디어 소개

### 한 문장 요약
AI Agent 아이디어를 구조화된 분석과 실현 가능성 평가를 통해 프로토타입 명세서로 변환하는 웹 애플리케이션

### 배경 (왜 이 아이디어인가?)

**문제 상황:**
- 고객이나 팀원이 "AI Agent로 이걸 자동화하면 어떨까?"라는 막연한 아이디어를 제시
- 실현 가능성을 판단하기 어렵고, 구조화되지 않은 상태로 개발 시작
- 개발 후 "데이터 접근이 안 되네요", "정확도가 너무 낮아요" 같은 문제를 뒤늦게 발견
- 시간과 비용 낭비, 프로젝트 실패 위험

**해결 방안:**
- P.A.T.H 프레임워크를 통해 아이디어를 체계적으로 분석
- Claude AI가 대화형으로 부족한 정보를 질문하고 보완
- Feasibility 점수(50점 만점)로 정량적 평가
- 3-Axis 패턴 모델(Execution × Quality × Scale)로 구현 방향 제시
- 구현 명세서 자동 생성으로 개발팀에 즉시 전달 가능

### 핵심 가치

1. **빠른 검증**: 코딩 전에 실현 가능성 파악
2. **구조화된 분석**: INPUT → PROCESS → OUTPUT → Human-in-Loop 프레임워크
3. **정량적 평가**: 5개 항목 50점 만점 Feasibility 점수
4. **실용적 패턴**: 3-Axis 모델로 구체적인 구현 방향 제시
5. **즉시 활용**: 명세서 자동 생성 및 다운로드

## 2️⃣ 구현 아이디어

### 기본 콘셉트

**3단계 워크플로우:**

**Step 1: 기본 정보 입력**
- Pain Point (해결하고 싶은 문제)
- INPUT 타입 (Event-Driven, Scheduled, On-Demand, Streaming, Conditional)
- PROCESS 작업 (데이터 수집, 분석/분류, 판단/평가, 콘텐츠 생성, 검증/개선, 실행/연동)
- OUTPUT 타입 (Decision, Content, Notification, Action, Insight)
- Human-in-Loop (None, Review, Exception, Collaborate)
- 데이터 소스 (어디서 데이터를 가져오는지)
- 오류 허용도 (틀려도 괜찮음 ~ 매우 높은 정확도 필요)

**Step 2: Claude 분석**
- Claude Sonnet 4.5가 입력 정보를 분석
- 부족한 정보에 대해 추가 질문 (최대 3턴)
- 실시간 스트리밍 응답으로 분석 과정 표시
- 사용자가 "분석 완료" 클릭 시 최종 분석 수행

**Step 3: 결과 확인**
- 5개 탭으로 구성:
  - 📊 상세 분석: Feasibility 점수, 추천 패턴, Problem Decomposition
  - 💬 대화 내역: Claude와의 전체 대화
  - 📋 명세서: 구현 명세서 생성 및 다운로드 (Markdown)
  - ⚠️ 리스크: 주의사항 및 개선 필요 항목
  - 🚀 다음 단계: 세션 저장/불러오기

### 필요한 주요 기능

**1. 입력 폼 관리**
- 구조화된 입력 필드 (드롭다운, 멀티셀렉트, 텍스트)
- 실시간 유효성 검증
- 입력 데이터 세션 저장

**2. Claude AI 통합**
- AWS Bedrock Claude Sonnet 4.5 API 호출
- 스트리밍 응답 처리
- 대화 히스토리 관리
- 프롬프트 템플릿 관리 (prompt_v3.txt)

**3. 분석 결과 처리**
- JSON 파싱 및 구조화
- 3-Axis 패턴 (E+Q+S) 파싱 및 표시
- Feasibility 점수 계산 및 시각화
- 패턴 상세 정보 표시

**4. 명세서 생성**
- Claude로 명세서 생성 요청
- Mermaid 다이어그램 포함
- Markdown 다운로드 기능

**5. 세션 관리**
- DynamoDB에 분석 결과 저장
- 이전 세션 목록 조회
- 세션 불러오기 및 삭제
- 세션 ID 기반 관리

**6. UI/UX**
- 3단계 진행 상태 표시
- 반응형 디자인
- 탭 기반 결과 표시
- 사이드바에 프레임워크 설명

### 사용자와 시나리오

**주요 사용자:**
- Solutions Architect (SA)
- 프로덕트 매니저
- 기술 리드
- 스타트업 창업자

**사용 시나리오 1: 고객 미팅**
1. 고객이 "AI로 계약서 검토 자동화하고 싶다"고 요청
2. 미팅 중 P.A.T.H 실행
3. 기본 정보 입력 (5분)
4. Claude 분석 및 질문 답변
5. Feasibility 38점 → "조건부 진행" 판정
6. 리스크 발견: "법률 Knowledge Base 구축 필요 (3개월)"
7. 고객에게 명세서와 함께 현실적인 계획 제시

**사용 시나리오 2: 내부 아이디어 검증**
1. 팀원이 "고객 이메일 자동 응답" 아이디어 제안
2. P.A.T.H로 빠른 분석
3. Feasibility 42점 → "즉시 프로토타입 시작" 판정
4. 추천 패턴: E4+Q1+S1 (Plan-and-Execute + Basic Reflection + Single)
5. 명세서 다운로드하여 개발팀에 전달
6. 세션 저장하여 나중에 참조

**사용 시나리오 3: 워크샵/해커톤**
1. 5개 AI Agent 아이디어 도출
2. 각 아이디어를 P.A.T.H로 분석
3. Feasibility 점수로 정렬
4. 최고 점수 아이디어 선택하여 프로토타입 구현

## 3️⃣ 기술 & 실현성

### 기술 스택 (생각하고 있는 것)

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn/ui (UI 컴포넌트)
- React Hook Form (폼 관리)
- Zod (유효성 검증)

**Backend:**
- Next.js API Routes
- AWS SDK for JavaScript v3

**Database:**
- AWS DynamoDB (세션 저장)

**AI/LLM:**
- AWS Bedrock (Claude Sonnet 4.5)

**Deployment:**
- AWS Amplify 또는 Vercel

**개발 도구:**
- ESLint + Prettier
- Vitest (Unit Tests)
- Playwright (E2E Tests)

### 데이터 모델

**Session (DynamoDB)**
```typescript
{
  session_id: string (PK)
  timestamp: string (ISO)
  pain_point: string
  input_type: string
  process_steps: string[]
  output_types: string[]
  human_loop: string
  data_source: string
  error_tolerance: string
  additional_context: string
  pattern: string (E+Q+S 형식)
  pattern_reason: string
  feasibility_breakdown: {
    data_access: number
    decision_clarity: number
    error_tolerance: number
    latency: number
    integration: number
  }
  feasibility_score: number
  recommendation: string
  risks: string[]
  next_steps: string[]
  chat_history: Array<{role: string, content: string}>
  specification: string
}
```

### 핵심 기능 우선순위

**MVP (Minimum Viable Service):**
1. ✅ Step 1: 기본 정보 입력 폼
2. ✅ Step 2: Claude 분석 (스트리밍)
3. ✅ Step 3: 결과 표시 (상세 분석, 대화 내역)
4. ✅ 명세서 생성 및 다운로드
5. ✅ 세션 저장/불러오기

**Phase 2 (추가 기능):**
- 사용자 인증 (Cognito)
- 팀 공유 기능
- 분석 히스토리 대시보드
- 명세서 템플릿 커스터마이징
- PDF 내보내기

**Phase 3 (고급 기능):**
- 여러 아이디어 비교 기능
- AI 추천 개선 (Fine-tuning)
- 실시간 협업 (WebSocket)
- 통계 및 인사이트

### 기술적 고려사항

**1. Claude API 통합**
- 스트리밍 응답 처리 (Server-Sent Events)
- 에러 핸들링 및 재시도 로직
- 프롬프트 버전 관리

**2. 성능**
- API Route 캐싱
- DynamoDB 쿼리 최적화
- 클라이언트 사이드 상태 관리 (React Context 또는 Zustand)

**3. 보안**
- AWS Credentials 관리 (환경 변수)
- API Rate Limiting
- Input Sanitization

**4. 사용자 경험**
- 로딩 상태 표시
- 에러 메시지 명확화
- 반응형 디자인 (모바일 지원)
- 키보드 단축키

### 예상 개발 기간

- **Week 1-2**: 프로젝트 셋업, 기본 레이아웃, Step 1 폼
- **Week 3-4**: Claude 통합, Step 2 분석, 스트리밍 응답
- **Week 5-6**: Step 3 결과 표시, 명세서 생성
- **Week 7**: 세션 관리 (DynamoDB)
- **Week 8**: 테스팅, 버그 수정, 배포

**총 예상 기간: 8주 (2개월)**
