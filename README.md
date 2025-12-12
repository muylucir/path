# P.A.T.H Agent Designer

AI Agent 아이디어를 **프로토타입으로 검증**하는 Streamlit 기반 웹 애플리케이션

## 개요

P.A.T.H (Problem → Agent → Technical → Handoff) 프레임워크를 사용하여 AI Agent 아이디어를 구조화하고, 실현 가능성을 평가하며, 구현 명세서를 자동 생성합니다.

### 주요 기능

- 🤖 **Claude Sonnet 4.5 기반 분석** - 대화형 인터페이스로 아이디어 검증
- 📊 **Feasibility 평가** - 5개 항목 50점 만점 평가
- 📋 **자동 명세서 생성** - 시퀀스 다이어그램, 플로우차트 포함
- 💾 **세션 저장/불러오기** - DynamoDB 기반 이력 관리
- 🎯 **AI Agent 패턴** - Reflection, Tool Use, Planning, Multi-Agent

## 설치

### 1. 의존성 설치

```bash
cd path
pip install streamlit boto3
```

또는 uv 사용:
```bash
uv sync
```

### 2. DynamoDB 테이블 생성

```bash
python create_dynamodb_table.py
```

테이블 이름: `path-agent-sessions`
리전: `ap-northeast-2`

### 3. AWS 자격증명 설정

```bash
aws configure
# 또는 환경변수 설정
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_DEFAULT_REGION=ap-northeast-2
```

## 실행

```bash
streamlit run app.py
```

브라우저에서 자동으로 열립니다: http://localhost:8501

## 사용 방법

### Step 1: 기본 정보 입력

1. **Pain Point** 입력 - 해결하고 싶은 문제
2. **INPUT** 선택 - 트리거 타입 (Event-Driven, Scheduled, On-Demand, Streaming, Conditional)
3. **PROCESS** 선택 - 필요한 작업 (복수 선택 가능)
   - 데이터 수집
   - 분석/분류
   - 판단/평가
   - 콘텐츠 생성
   - 검증/개선
   - 실행/연동
4. **OUTPUT** 선택 - 결과물 타입 (Decision, Content, Notification, Action, Insight)
5. **Human-in-Loop** 선택 - 사람 개입 시점 (None, Review, Exception, Collaborate)

### Step 2: Claude 분석

1. Claude가 초기 분석 수행
2. 추가 질문에 답변 (최대 3턴)
3. "분석 완료" 클릭

### Step 3: 결과 확인

5개 탭으로 구성:
- **📊 상세 분석** - Problem Decomposition, Feasibility 점수, 추천 패턴
- **💬 대화 내역** - Step 2의 전체 대화
- **📋 명세서** - 구현 명세서 생성 및 다운로드
- **⚠️ 리스크** - 리스크 및 개선 사항
- **🚀 다음 단계** - 다음 액션 및 세션 저장

## P.A.T.H 프레임워크

### Phase 1: Problem Decomposition
Pain Point를 4가지 요소로 분해:
- **INPUT**: 무엇이 트리거인가?
- **PROCESS**: 무슨 작업이 필요한가?
- **OUTPUT**: 결과물은 무엇인가?
- **HUMAN-IN-LOOP**: 사람 개입 시점은?

### Phase 2: Agent Pattern Mapping
Andrew Ng의 4가지 패턴:
- **Reflection**: 품질 검증 후 자가 개선
- **Tool Use**: 외부 도구/API 호출
- **Planning**: 단계별 분해 실행
- **Multi-Agent**: 여러 에이전트 협업

### Phase 3: Feasibility Check
5개 항목 평가 (총 50점):
1. 데이터 접근성 (10점)
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
구현 명세서 자동 생성:
1. Executive Summary
2. Problem Decomposition
3. Architecture (시퀀스 다이어그램, 플로우차트)
4. Agent Components
5. Technical Stack

## 기술 스택

- **Frontend**: Streamlit 1.x
- **LLM**: Claude Sonnet 4.5 (AWS Bedrock)
- **Database**: DynamoDB (세션 저장)
- **Language**: Python 3.12+
- **Cloud**: AWS

## 프로젝트 구조

```
path/
├── app.py                      # 메인 Streamlit 애플리케이션
├── create_dynamodb_table.py    # DynamoDB 테이블 생성 스크립트
├── README.md                   # 이 파일
├── pyproject.toml              # 프로젝트 설정
└── .venv/                      # 가상환경
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

### 2. 자동 명세서 생성
- 5개 핵심 섹션 (프로토타입 중심)
- Mermaid 다이어그램 자동 생성
- Markdown 다운로드

### 3. 세션 관리
- DynamoDB에 분석 결과 저장
- 이전 세션 불러오기
- 세션 삭제

## 라이선스

MIT

## 기여

이슈 및 PR 환영합니다!

## 참고

- [P.A.T.H 프레임워크 문서](../PATH.md)
- [Andrew Ng's Agentic Design Patterns](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance/)
- [Streamlit Documentation](https://docs.streamlit.io/)
