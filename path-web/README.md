# P.A.T.H Agent Designer (Web)

AI Agent 아이디어를 **프로토타입으로 검증**하는 Next.js 기반 웹 애플리케이션

## 개요

P.A.T.H (Problem → Agent → Technical → Handoff) 프레임워크를 사용하여 AI Agent 아이디어를 구조화하고, 실현 가능성을 평가하며, **Strands Agent 기반 구현 명세서**를 자동 생성합니다.

### 주요 기능

- 🤖 **Claude Sonnet 4.5 기반 분석** - 대화형 인터페이스로 아이디어 검증
- 📊 **Feasibility 평가** - 5개 항목 50점 만점 평가
- 📋 **자동 명세서 생성** - Strands Agent 구현 가이드 포함
- 🏗️ **호스팅 환경 선택** - EC2/ECS/EKS 또는 Amazon Bedrock AgentCore
- 💾 **세션 저장/불러오기** - DynamoDB 기반 이력 관리
- 🎯 **Strands Agent 패턴** - Graph, Agent-as-Tool, Invocation State

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **LLM**: Claude Sonnet 4.5 (AWS Bedrock)
- **Database**: DynamoDB (세션 저장)
- **Deployment**: Vercel / AWS Amplify

## 설치 및 실행

### 1. 의존성 설치

```bash
cd path-web
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```bash
# AWS 자격증명은 환경변수 또는 ~/.aws/credentials 사용
AWS_REGION=ap-northeast-2
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm start
```

## 사용 방법

### Step 1: 기본 정보 입력

1. **호스팅 환경** 선택
   - EC2/ECS/EKS: 직접 호스팅
   - AgentCore: Amazon Bedrock AgentCore 서버리스

2. **Pain Point** 입력 - 해결하고 싶은 문제

3. **INPUT** 선택 - 트리거 타입
   - Event-Driven, Scheduled, On-Demand, Streaming, Conditional

4. **PROCESS** 선택 - 필요한 작업 (복수 선택)
   - 데이터 수집, 분석/분류, 판단/평가, 콘텐츠 생성, 검증/개선, 실행/연동

5. **OUTPUT** 선택 - 결과물 타입 (복수 선택)
   - Decision, Content, Notification, Action, Insight

6. **Human-in-Loop** 선택
   - None, Review, Exception, Collaborate

7. **Data Sources** 입력
   - MCP Server, RAG, API, Database, File, Web Scraping

8. **Error Tolerance** 선택

### Step 2: Claude 분석

1. Claude가 초기 분석 수행
2. 추가 질문에 답변 (최대 3턴)
3. "분석 완료" 클릭

### Step 3: 결과 확인

4개 탭으로 구성:
- **📊 상세 분석**: Feasibility 점수, Strands Agent 구현 전략
- **💬 대화 내역**: Step 2의 전체 대화
- **📋 명세서**: Strands Agent 구현 명세서 생성 및 다운로드
- **🚀 다음 단계**: 다음 액션 및 세션 저장

## P.A.T.H 프레임워크

### Phase 1: Problem Decomposition
Pain Point를 4가지 요소로 분해:
- **INPUT**: 무엇이 트리거인가?
- **PROCESS**: 무슨 작업이 필요한가?
- **OUTPUT**: 결과물은 무엇인가?
- **HUMAN-IN-LOOP**: 사람 개입 시점은?

### Phase 2: Strands Agent 구현 전략
4가지 패턴을 Strands Agent로 구현:
- **Reflection** → Graph의 순환 구조
- **Tool Use** → Agent-as-Tool 활용
- **Planning** → Graph의 순차 노드 구조
- **Multi-Agent** → Graph + Agent-as-Tool 조합

### Phase 3: Feasibility Check
5개 항목 평가 (총 50점):
1. 데이터 접근성 (10점) - MCP/RAG: 10점, API: 9점
2. 판단 기준 명확성 (10점)
3. 오류 허용도 (10점)
4. 지연 요구사항 (10점)
5. 통합 복잡도 (10점)

**판정 기준:**
- 40-50점: ✅ 즉시 프로토타입 시작
- 30-40점: ⚠️ 조건부 진행
- 20-30점: 🔄 개선 후 재평가
- 20점 미만: ❌ 대안 모색

### Phase 4: Handoff Specification
Strands Agent 구현 명세서 자동 생성:
1. Executive Summary
2. Strands Agent 구현
   - Agent Components
   - 패턴 분석
   - Graph 구조
   - Agent-as-Tool
   - Invocation State 활용
   - MCP 연동
   - **AgentCore 서비스 구성** (AgentCore 선택 시)
3. Architecture (Mermaid 다이어그램)
4. Problem Decomposition

## Amazon Bedrock AgentCore

AgentCore를 선택하면 명세서에 다음 서비스 활용 가이드가 추가됩니다:

- **AgentCore Runtime**: 서버리스 에이전트 호스팅
- **AgentCore Memory**: 단기/장기 메모리 관리
- **AgentCore Gateway**: API/Lambda를 MCP 도구로 변환
- **AgentCore Identity**: OAuth 연동 및 API 키 관리
- **AgentCore Browser**: 웹 자동화
- **AgentCore Code Interpreter**: 코드 실행

## 프로젝트 구조

```
path-web/
├── app/
│   ├── page.tsx                    # Step 1: 기본 정보 입력
│   ├── analyze/page.tsx            # Step 2: Claude 분석
│   ├── results/page.tsx            # Step 3: 결과 확인
│   ├── sessions/page.tsx           # 세션 관리
│   └── api/
│       ├── bedrock/
│       │   ├── analyze/route.ts    # 초기 분석 API
│       │   ├── chat/route.ts       # 대화 API
│       │   ├── finalize/route.ts   # 최종 분석 API
│       │   └── spec/route.ts       # 명세서 생성 API
│       └── sessions/
│           ├── route.ts            # 세션 목록/저장
│           └── [id]/route.ts       # 세션 조회/삭제
├── components/
│   ├── steps/
│   │   ├── Step1Form.tsx           # 입력 폼
│   │   ├── Step2Analysis.tsx       # 분석 대화
│   │   └── Step3Results.tsx           # 결과 표시
│   ├── analysis/
│   │   ├── DetailedAnalysis.tsx    # 상세 분석
│   │   ├── Specification.tsx       # 명세서
│   │   └── MDXRenderer.tsx         # Markdown 렌더링
│   └── ui/                         # shadcn/ui 컴포넌트
├── lib/
│   ├── prompts.ts                  # 시스템 프롬프트
│   ├── constants.ts                # 상수 정의
│   ├── types.ts                    # TypeScript 타입
│   ├── schema.ts                   # Zod 스키마
│   └── aws/
│       ├── bedrock.ts              # Bedrock 클라이언트
│       └── dynamodb.ts             # DynamoDB 클라이언트
└── public/                         # 정적 파일
```

## 환경 변수

필요한 AWS 권한:
- `bedrock:InvokeModel` - Claude 모델 호출
- `bedrock:InvokeModelWithResponseStream` - 스트리밍 응답
- `dynamodb:PutItem` - 세션 저장
- `dynamodb:GetItem` - 세션 로드
- `dynamodb:Scan` - 세션 목록 조회
- `dynamodb:DeleteItem` - 세션 삭제

## 주요 기능

### 1. 대화형 분석
- Claude와 자연스러운 대화로 아이디어 검증
- 실시간 스트리밍 응답
- 최대 3턴 대화로 빠른 의사결정

### 2. Strands Agent 명세서 생성
- Strands Agent 구현 가이드
- Graph 구조 및 Agent-as-Tool 활용법
- Mermaid 다이어그램 자동 생성
- AgentCore 서비스 조합 가이드 (선택 시)
- Markdown 다운로드

### 3. 세션 관리
- DynamoDB에 분석 결과 저장
- 이전 세션 불러오기
- 세션 삭제

### 4. 호스팅 환경 선택
- Self-hosted (EC2/ECS/EKS): 직접 인프라 관리
- AgentCore: 서버리스 관리형 환경

## 개발

### 코드 포맷팅

```bash
npm run lint
```

### 타입 체크

```bash
npm run type-check
```

## 배포

### Vercel

```bash
vercel --prod
```

### AWS Amplify

1. GitHub 리포지토리 연결
2. 빌드 설정:
   - Build command: `npm run build`
   - Output directory: `.next`
3. 환경 변수 설정

## 라이선스

MIT

## 참고

- [P.A.T.H 프레임워크 문서](../PATH.md)
- [Strands Agents](https://strandsagents.com/)
- [Amazon Bedrock AgentCore](https://aws.amazon.com/bedrock/agentcore/)
- [Next.js Documentation](https://nextjs.org/docs)
