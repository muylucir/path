# P.A.T.H Agent Designer

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

## 설치 및 실행

### 1. 의존성 설치

```bash
cd path-web
npm install
```

### 2. DynamoDB 테이블 생성

```bash
# AWS CLI로 테이블 생성
aws dynamodb create-table \
  --table-name path-agent-sessions \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-2
```

### 3. AWS 자격증명 설정

```bash
aws configure
# 또는 환경변수 설정
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=ap-northeast-2
```

### 4. 환경 변수 설정

`path-web/.env.local` 파일 생성:

```bash
AWS_REGION=ap-northeast-2
```

### 5. 개발 서버 실행

```bash
cd path-web
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 사용 방법

### Step 1: 기본 정보 입력

1. **호스팅 환경** 선택
   - EC2/ECS/EKS ↔ AgentCore (토글 스위치)

2. **Pain Point** 입력 - 해결하고 싶은 문제

3. **INPUT** 선택 - 트리거 타입 (Event-Driven, Scheduled, On-Demand, Streaming, Conditional)

4. **PROCESS** 선택 - 필요한 작업 (복수 선택 가능)
   - 데이터 수집, 분석/분류, 판단/평가, 콘텐츠 생성, 검증/개선, 실행/연동

5. **OUTPUT** 선택 - 결과물 타입 (복수 선택 가능)
   - Decision, Content, Notification, Action, Insight

6. **Human-in-Loop** 선택 - 사람 개입 시점 (None, Review, Exception, Collaborate)

7. **Data Sources** 입력 - MCP Server, RAG, API, Database, File, Web Scraping

8. **Error Tolerance** 선택

### Step 2: Claude 분석

1. Claude가 초기 분석 수행
2. 추가 질문에 답변 (최대 3턴)
3. "분석 완료" 클릭

### Step 3: 결과 확인

4개 탭으로 구성:
- **📊 상세 분석** - Feasibility 점수, Strands Agent 구현 전략
- **💬 대화 내역** - Step 2의 전체 대화
- **📋 명세서** - Strands Agent 구현 명세서 생성 및 다운로드
- **🚀 다음 단계** - 다음 액션 및 세션 저장

## P.A.T.H 프레임워크

### Phase 1: Problem Decomposition
Pain Point를 4가지 요소로 분해:
- **INPUT**: 무엇이 트리거인가?
- **PROCESS**: 무슨 작업이 필요한가?
- **OUTPUT**: 결과물은 무엇인가?
- **HUMAN-IN-LOOP**: 사람 개입 시점은?

### Phase 2: Strands Agent 구현 전략
4가지 패턴을 Strands Agent로 구현:
- **Reflection** → Graph의 순환 구조 (self-review loop)
- **Tool Use** → Agent-as-Tool 직접 활용
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
호스팅 환경에 따른 명세서 생성:

**Self-hosted (EC2/ECS/EKS)**
1. Executive Summary
2. Strands Agent 구현
3. Architecture (Mermaid 다이어그램)
4. Problem Decomposition

**Amazon Bedrock AgentCore**
1. Executive Summary
2. Strands Agent 구현 + **AgentCore 서비스 구성**
3. Architecture (AgentCore 기반 다이어그램)
4. Problem Decomposition

## Amazon Bedrock AgentCore

AgentCore를 선택하면 명세서에 다음 서비스 활용 가이드가 추가됩니다:

- **AgentCore Runtime** (필수): 서버리스 에이전트 호스팅
- **AgentCore Memory** (필요시): 단기/장기 메모리 관리
- **AgentCore Gateway** (필요시): API/Lambda를 MCP 도구로 변환
- **AgentCore Identity** (필요시): OAuth 연동 및 API 키 관리
- **AgentCore Browser** (필요시): 웹 자동화
- **AgentCore Code Interpreter** (필요시): 코드 실행

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, shadcn/ui
- **LLM**: Claude Sonnet 4.5, Haiku 4.5 (AWS Bedrock)
- **Database**: DynamoDB (세션 저장)
- **Cloud**: AWS

## 프로젝트 구조

```
path/
├── path-web/                       # Next.js 웹 애플리케이션
│   ├── app/
│   │   ├── page.tsx                # Step 1: 기본 정보 입력
│   │   ├── analyze/page.tsx        # Step 2: Claude 분석
│   │   ├── results/page.tsx        # Step 3: 결과 확인
│   │   ├── sessions/page.tsx       # 세션 관리
│   │   └── api/bedrock/            # Bedrock API 라우트
│   ├── components/                 # React 컴포넌트
│   ├── lib/                        # 유틸리티 및 설정
│   └── public/                     # 정적 파일
├── spec/                           # 생성된 명세서 예시
├── PATH.md                         # P.A.T.H 프레임워크 문서
└── README.md                       # 이 파일
```

## 환경 변수

필요한 AWS 권한:
- `bedrock:InvokeModel` - Claude 모델 호출
- `bedrock:InvokeModelWithResponseStream` - 스트리밍 응답
- `dynamodb:PutItem` - 세션 저장
- `dynamodb:GetItem` - 세션 로드
- `dynamodb:Scan` - 세션 목록 조회
- `dynamodb:DeleteItem` - 세션 삭제

## 배포

### Vercel (권장)

```bash
cd path-web
vercel --prod
```

### AWS Amplify

1. GitHub 리포지토리 연결
2. 빌드 설정:
   - Build command: `npm run build`
   - Output directory: `.next`
   - Root directory: `path-web`
3. 환경 변수 설정

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

## 라이선스

MIT

## 기여

이슈 및 PR 환영합니다!

## 참고

- [P.A.T.H 프레임워크 문서](PATH.md)
- [Strands Agents](https://strandsagents.com/)
- [Amazon Bedrock AgentCore](https://aws.amazon.com/bedrock/agentcore/)
- [Next.js Documentation](https://nextjs.org/docs)
