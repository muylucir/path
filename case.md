# P.A.T.H v2.0 워크시트 예시 10개

새로운 패턴 명칭 (Andrew Ng 표준):
- Tool Use (단순 도구 사용)
- Planning (순차적 계획)
- Multi-Agent (다중 에이전트)
- Reflection (자기 개선)

---

## Case 1: Slack 봇 - 간단한 정보 조회

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: TechCorp Inc.
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"개발자들이 배포 상태, DB 커넥션 수, 에러율 같은 정보를 
확인하려고 매번 CloudWatch나 Grafana에 들어가야 해요.
Slack에서 바로 물어보고 답변 받고 싶어요."

## 2. Decomposition

### INPUT
- [X] 이벤트형  [ ] 스케줄형  [X] 요청형  [ ] 스트리밍  [ ] 조건부
- 구체적으로: Slack 명령어 (/status, /errors, /connections)

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? CloudWatch API, RDS API
- [ ] 분석/분류 - 기준은? N/A
- [ ] 판단/평가 - 기준은? N/A
- [ ] 콘텐츠 생성 - 무엇을? N/A (단순 데이터 반환)
- [ ] 검증/개선 - 어떻게? N/A
- [X] 실행/연동 - 어디에? Slack 메시지 전송

### OUTPUT
- [ ] 의사결정  [X] 콘텐츠  [ ] 알림  [ ] 액션  [ ] 인사이트
- 구체적으로: Slack 메시지 (텍스트 + 차트)

### HUMAN-IN-LOOP
- [X] None  [ ] Review  [ ] Exception  [ ] Collaborate
- 이유: 단순 조회 작업, 리스크 없음

## 3. Pattern Selection

- [X] **Tool Use** (단순 1-2단계, API 호출만)
- [ ] **Planning** (순차적 계획)
- [ ] **Multi-Agent** (병렬/협업)
- [ ] **Reflection** (품질 개선 루프)

선택 이유: 
- 사용자 명령 → CloudWatch API 호출 → Slack 응답
- 복잡한 추론 불필요, 도구 호출만으로 충분
- 1단계 변환

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 10 | CloudWatch API 완벽 지원 |
| Decision Clarity | 10 | 명령어 파싱 규칙 명확 |
| Error Tolerance | 10 | 잘못 조회해도 재시도 가능 |
| Latency | 9 | 3-5초 응답 목표 |
| Integration | 9 | Slack API, CloudWatch API |
| **Total** | **48/50** | |

## 5. Quick Architecture Sketch

```
Slack (/status) → API Gateway → Lambda
                                   ├→ CloudWatch API
                                   └→ RDS DescribeDBInstances
                                        ↓
                                   Format Response
                                        ↓
                                   Slack Post Message
```

## 6. 다음 액션

- [X] 즉시 프로토타입 (>40점)
- [ ] 조건부 진행 (30-40점)
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. Slack App 생성 및 Bot Token 발급
2. Lambda 함수 작성 (Python + boto3)
3. 3개 명령어 구현 (/status, /errors, /connections)

### 필요한 리소스:
- 데이터: CloudWatch Metrics, RDS API 접근 권한
- 인력: 개발자 1명 (2-3일)
- 예산: Lambda + API 호출 (월 $5 예상)

## 7. 예상 타임라인

- Week 1: 프로토타입 완성 + 내부 테스트
- Week 2: 명령어 추가, 에러 핸들링 개선
- Week 3: Production 배포
- Week 4: 사용자 피드백 반영

## 8. 메모 & 질문사항

- Slack workspace에 이미 다른 bot이 있는지 확인
- CloudWatch 외에 추가로 조회할 메트릭 있는지 논의
- 차트 이미지 생성 필요 여부 (QuickChart.io 활용 가능)

**Risk Level**: 🟢 LOW - 매우 안전한 프로젝트
**Expected ROI**: 개발자 시간 절약 30분/일 → 월 10시간 절감
```

---

## Case 2: 이상 거래 실시간 탐지

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: FinPay Solutions
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"결제 시스템에서 비정상 패턴(고액 결제, 짧은 시간 다수 결제 등)을
실시간으로 잡아내고 싶어요. 현재는 익일 배치로 확인해서 
이미 피해가 발생한 후에 알게 돼요."

## 2. Decomposition

### INPUT
- [ ] 이벤트형  [ ] 스케줄형  [ ] 요청형  [X] 스트리밍  [X] 조건부
- 구체적으로: Kinesis Data Stream (결제 이벤트), 임계값 초과 시

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? 결제 스트림, 고객 히스토리 (RDS)
- [X] 분석/분류 - 기준은? 이상 패턴 분류 (금액, 빈도, 위치)
- [X] 판단/평가 - 기준은? 위험도 점수 (0-100)
- [ ] 콘텐츠 생성 - 무엇을? N/A
- [ ] 검증/개선 - 어떻게? N/A
- [X] 실행/연동 - 어디에? PagerDuty 알림, 결제 일시정지 API

### OUTPUT
- [X] 의사결정  [ ] 콘텐츠  [X] 알림  [X] 액션  [ ] 인사이트
- 구체적으로: 위험도 점수 + PagerDuty 알림 + 자동 차단 (고위험만)

### HUMAN-IN-LOOP
- [ ] None  [ ] Review  [X] Exception  [ ] Collaborate
- 이유: 위험도 > 90점만 자동 차단, 70-90점은 사람 검토

## 3. Pattern Selection

- [ ] **Tool Use**
- [X] **Planning** (순차적 분석 필요)
- [ ] **Multi-Agent**
- [ ] **Reflection**

선택 이유:
- 명확한 3단계: 데이터 수집 → 분석 → 판단 → 실행
- 각 단계가 이전 결과에 의존
- 스트리밍 환경에서 빠른 순차 처리

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 9 | Kinesis + RDS API |
| Decision Clarity | 7 | 이상 패턴 정의 필요, 과거 데이터로 학습 |
| Error Tolerance | 5 | False positive는 괜찮지만 False negative 위험 |
| Latency | 6 | 3초 이내 필수 (실시간) |
| Integration | 6 | Kinesis, RDS, PagerDuty, 결제 시스템 |
| **Total** | **33/50** | |

## 5. Quick Architecture Sketch

```
Kinesis Stream → Lambda (Event)
                    ↓
                 1. Fetch Customer History (RDS)
                    ↓
                 2. Analyze Pattern (Bedrock Haiku)
                    ↓
                 3. Calculate Risk Score
                    ↓
                 4. Decision Logic
                    ├→ [>90] Block + PagerDuty
                    ├→ [70-90] PagerDuty (human review)
                    └→ [<70] Log only
```

## 6. 다음 액션

- [ ] 즉시 프로토타입 (>40점)
- [X] 조건부 진행 (30-40점) - 리스크: False positive 관리, 실시간 성능
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. 과거 1개월 결제 데이터로 이상 패턴 분석
2. 위험도 점수 알고리즘 정의 (룰베이스 + ML)
3. 테스트 환경 구축 (프로덕션 데이터 복제)

### 필요한 리소스:
- 데이터: 과거 결제 로그 (정상 + 이상), 고객 프로필
- 인력: 개발자 1명 + 보안 전문가 1명 (2주)
- 예산: Lambda 실행 비용 (월 $200 예상)

## 7. 예상 타임라인

- Week 1-2: 룰베이스 프로토타입 (임계값 기반)
- Week 3-4: ML 모델 추가 (이상 탐지)
- Week 5: Canary 배포 (10% 트래픽)
- Week 6-8: 모니터링 및 튜닝

## 8. 메모 & 질문사항

- False positive 허용 범위는? (고객 불편 vs 보안)
- 차단된 거래의 복구 프로세스는?
- PagerDuty 대기자는 24/7인가?
- 규제 요구사항 (PCI-DSS 등) 확인 필요

**Risk Level**: 🟡 MEDIUM - 실시간 성능, False positive 관리
**Expected ROI**: 월 $50K 부정거래 방지
```

---

## Case 3: 주간 경쟁사 분석 리포트

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: MarketInsight Co.
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"경쟁사 5개의 동향을 매주 수동으로 조사해서 리포트 만드는데
마케팅팀이 금요일 오후 4시간씩 쓰고 있어요.
웹사이트, 보도자료, SNS를 다 확인해야 해서 번거로워요."

## 2. Decomposition

### INPUT
- [ ] 이벤트형  [X] 스케줄형  [ ] 요청형  [ ] 스트리밍  [ ] 조건부
- 구체적으로: 매주 금요일 오전 9시

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? 
  - 경쟁사 웹사이트 (스크래핑)
  - 뉴스 API (Google News)
  - SNS (Twitter API)
- [X] 분석/분류 - 기준은? 주제별 분류 (제품, 가격, 채용, 투자 등)
- [ ] 판단/평가 - 기준은? N/A
- [X] 콘텐츠 생성 - 무엇을? 주간 요약 리포트 (PDF)
- [ ] 검증/개선 - 어떻게? N/A
- [X] 실행/연동 - 어디에? Slack 채널 발송, S3 저장

### OUTPUT
- [ ] 의사결정  [X] 콘텐츠  [X] 알림  [ ] 액션  [X] 인사이트
- 구체적으로: PDF 리포트 + Slack 요약 메시지 + 트렌드 인사이트

### HUMAN-IN-LOOP
- [ ] None  [X] Review  [ ] Exception  [ ] Collaborate
- 이유: 자동 생성 후 마케팅 매니저 검토 → 팀 공유

## 3. Pattern Selection

- [ ] **Tool Use**
- [ ] **Planning**
- [X] **Multi-Agent** (병렬 데이터 수집 + 통합)
- [ ] **Reflection**

선택 이유:
- 5개 경쟁사 × 3개 소스 = 15개 작업을 병렬 실행
- 각 경쟁사별 agent가 독립적으로 수집
- Master agent가 결과 통합 및 리포트 생성
- 속도 중요 (15개 순차 실행하면 30분 → 병렬로 5분)

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 6 | 웹 스크래핑 (불안정), News/Twitter API |
| Decision Clarity | 8 | 주제 분류 기준 명확 |
| Error Tolerance | 9 | 일부 실패해도 나머지로 리포트 작성 가능 |
| Latency | 10 | 30분 이내 OK |
| Integration | 7 | Slack, S3, 여러 웹사이트 |
| **Total** | **40/50** | |

## 5. Quick Architecture Sketch

```
EventBridge (매주 금 09:00)
    ↓
Master Orchestrator Lambda
    ├→ CompetitorAgent-1 (경쟁사 A)
    │    ├→ WebScraper
    │    ├→ NewsAPI
    │    └→ TwitterAPI
    ├→ CompetitorAgent-2 (경쟁사 B)
    ├→ CompetitorAgent-3 (경쟁사 C)
    ├→ CompetitorAgent-4 (경쟁사 D)
    └→ CompetitorAgent-5 (경쟁사 E)
         ↓
    Aggregator & Reporter (Bedrock Sonnet)
         ↓
    PDF Generation + S3 Upload + Slack
```

## 6. 다음 액션

- [X] 즉시 프로토타입 (>40점)
- [ ] 조건부 진행 (30-40점)
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. 경쟁사 1개로 프로토타입 (웹+뉴스+트위터)
2. PDF 템플릿 디자인 (마케팅팀과 협의)
3. 병렬 실행 로직 구현 (Step Functions Parallel)

### 필요한 리소스:
- 데이터: 경쟁사 URL 리스트, Twitter API 키
- 인력: 개발자 1명 (1.5주)
- 예산: Lambda + API 호출 (월 $30), Twitter API Pro ($100/월)

## 7. 예상 타임라인

- Week 1: 단일 경쟁사 프로토타입
- Week 2: 5개 경쟁사 병렬 처리 + PDF 생성
- Week 3: 프로덕션 배포, 에러 핸들링
- Week 4: 마케팅팀 피드백 반영

## 8. 메모 & 질문사항

- 웹사이트 변경 시 스크래핑 로직 깨질 수 있음 → 정기 점검 필요
- Twitter API 비용 월 $100 - 예산 승인 필요
- 리포트 포맷 샘플 필요 (기존 수동 리포트 공유 요청)
- 일부 경쟁사 웹사이트가 CloudFlare 보호 → 우회 전략 논의

**Risk Level**: 🟡 MEDIUM - 웹 스크래핑 안정성
**Expected ROI**: 마케팅팀 16시간/월 절감
```

---

## Case 4: 채용 후보자 기술 면접 준비 자료 생성

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: DevRecruit Inc.
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"기술 면접 전에 후보자의 GitHub, 링크드인, 포트폴리오를 
다 확인해서 질문 리스트 만드는데 면접관이 1시간씩 준비해요.
후보자마다 맞춤형 질문을 자동으로 만들고 싶어요."

## 2. Decomposition

### INPUT
- [X] 이벤트형  [ ] 스케줄형  [ ] 요청형  [ ] 스트리밍  [ ] 조건부
- 구체적으로: ATS(Greenhouse)에서 면접 일정 확정 시

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? 
  - GitHub API (repositories, commits)
  - LinkedIn (via scraping or API)
  - 이력서 (S3 PDF)
- [X] 분석/분류 - 기준은? 기술 스택, 경력, 프로젝트 규모
- [X] 판단/평가 - 기준은? 강점/약점 영역 파악
- [X] 콘텐츠 생성 - 무엇을? 
  - 후보자 프로필 요약
  - 맞춤형 기술 질문 15개
  - 예상 답변 (참고용)
- [X] 검증/개선 - 어떻게? 
  - 질문 품질 체크 (너무 쉽거나 어려운 것 제거)
  - 중복 질문 제거
- [X] 실행/연동 - 어디에? Notion 페이지 생성, 면접관 이메일

### OUTPUT
- [ ] 의사결정  [X] 콘텐츠  [X] 알림  [ ] 액션  [X] 인사이트
- 구체적으로: Notion 문서 (프로필+질문) + 면접관 알림

### HUMAN-IN-LOOP
- [ ] None  [X] Review  [ ] Exception  [ ] Collaborate
- 이유: 면접관이 질문 리스트 검토 후 면접 진행

## 3. Pattern Selection

- [ ] **Tool Use**
- [ ] **Planning**
- [X] **Multi-Agent** (병렬 수집) + **Reflection** (질문 개선)
- [X] **Reflection**

선택 이유:
- Phase 1: Multi-Agent로 GitHub, LinkedIn, Resume 병렬 수집
- Phase 2: Planning으로 분석 → 질문 생성
- Phase 3: Reflection으로 질문 품질 개선 (2-3회 반복)

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 7 | GitHub API 좋음, LinkedIn 어려움 |
| Decision Clarity | 7 | "좋은 질문" 기준이 다소 주관적 |
| Error Tolerance | 9 | 면접관이 최종 검토 |
| Latency | 9 | 면접 1일 전이면 충분 |
| Integration | 7 | Greenhouse, GitHub, Notion, Email |
| **Total** | **39/50** | |

## 5. Quick Architecture Sketch

```
Greenhouse Webhook (면접 확정)
    ↓
Step Functions
    ├→ [Parallel] Data Collection
    │    ├→ GitHubAgent
    │    ├→ LinkedInAgent
    │    └→ ResumeParser
    │         ↓
    ├→ [Sequential] Analysis & Generation
    │    ├→ ProfileAnalyzer (Bedrock Sonnet)
    │    ├→ QuestionGenerator (Bedrock Sonnet)
    │    │    ↓
    │    └→ [Reflection Loop - max 3회]
    │         ├→ QualityChecker
    │         └→ Refiner
    │              ↓
    └→ [Output] Notion API + SES Email
```

## 6. 다음 액션

- [ ] 즉시 프로토타입 (>40점)
- [X] 조건부 진행 (30-40점) - 리스크: LinkedIn 접근, 질문 품질
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. GitHub 데이터 수집 프로토타입 (실제 후보자 1명)
2. 질문 생성 prompt 엔지니어링 (면접관과 협업)
3. 품질 평가 기준 정의 (좋은 질문 vs 나쁜 질문)

### 필요한 리소스:
- 데이터: 과거 면접 질문 100개 (good/bad 레이블링)
- 인력: 개발자 1명 + 채용 담당자 (2주)
- 예산: Lambda + Bedrock API (월 $50)

## 7. 예상 타임라인

- Week 1: GitHub 수집 + 질문 생성 (단순 버전)
- Week 2: Reflection loop 구현, 품질 개선
- Week 3: Greenhouse 연동, Notion 생성
- Week 4: 실제 면접 3건 테스트, 피드백 수집

## 8. 메모 & 질문사항

- LinkedIn 접근이 어려움 → 대안: 후보자가 직접 업로드?
- 기존 면접 질문 템플릿 있는지 확인
- 포지션별 질문 차별화 필요 (Backend vs Frontend vs DevOps)
- GDPR/개인정보: 후보자 동의 필요

**Risk Level**: 🟡 MEDIUM - LinkedIn 접근, 질문 품질 주관성
**Expected ROI**: 면접관 준비 시간 80% 절감 (1시간 → 10분)
```

---

## Case 5: 데이터베이스 쿼리 자동 최적화

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: DataScale Corp.
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"느린 쿼리가 발생하면 DBA가 수동으로 분석하고 최적화하는데
한 건당 2-3시간 걸려요. 인덱스 추가, 쿼리 재작성 같은
패턴이 반복되는데 이걸 자동화하고 싶어요."

## 2. Decomposition

### INPUT
- [ ] 이벤트형  [ ] 스케줄형  [ ] 요청형  [ ] 스트리밍  [X] 조건부
- 구체적으로: CloudWatch Alarm (쿼리 실행 시간 > 5초)

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? 
  - Slow query log
  - Table schema (INFORMATION_SCHEMA)
  - Execution plan (EXPLAIN)
  - Index 현황
- [X] 분석/분류 - 기준은? 병목 원인 (Full table scan, 인덱스 누락 등)
- [X] 판단/평가 - 기준은? 최적화 우선순위, 영향도, 복잡도
- [X] 콘텐츠 생성 - 무엇을? 
  - 최적화 제안서 (인덱스 추가, 쿼리 재작성)
  - SQL 스크립트 (실행 가능한)
- [X] 검증/개선 - 어떻게? 
  - 제안된 SQL을 테스트 DB에서 실행
  - 성능 개선 확인 (EXPLAIN 비교)
  - 안전성 검증 (부작용 없는지)
- [X] 실행/연동 - 어디에? Jira 티켓 생성, DBA Slack 알림

### OUTPUT
- [X] 의사결정  [X] 콘텐츠  [X] 알림  [ ] 액션  [X] 인사이트
- 구체적으로: 
  - 최적화 제안 (인덱스, 쿼리)
  - 예상 성능 개선도
  - Jira 티켓

### HUMAN-IN-LOOP
- [ ] None  [X] Review  [ ] Exception  [ ] Collaborate
- 이유: DBA가 제안 검토 후 프로덕션 적용

## 3. Pattern Selection

- [ ] **Tool Use**
- [X] **Planning** (순차 분석)
- [ ] **Multi-Agent**
- [X] **Reflection** (제안 검증 및 개선)

선택 이유:
- Planning: 데이터 수집 → 분석 → 제안 생성 (명확한 순서)
- Reflection: 생성된 제안을 테스트 DB에서 검증하고 개선 (2-3회 반복)
- 복합 패턴: 순차적 분석 + 반복 개선

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 7 | RDS API, Slow query log 파싱 필요 |
| Decision Clarity | 6 | 최적화 전략이 복잡, DBA 경험 필요 |
| Error Tolerance | 7 | DBA 검토 필수, 테스트 DB 활용 |
| Latency | 8 | 30분 이내 제안 생성 |
| Integration | 6 | RDS, CloudWatch, Jira, Slack |
| **Total** | **34/50** | |

## 5. Quick Architecture Sketch

```
CloudWatch Alarm (slow query > 5초)
    ↓
Step Functions
    ├→ [Planning Phase 1] Data Collection
    │    ├→ Fetch slow query log
    │    ├→ Get table schema
    │    └→ Get current indexes
    │         ↓
    ├→ [Planning Phase 2] Analysis
    │    └→ Identify bottleneck (Bedrock Sonnet)
    │         ↓
    ├→ [Planning Phase 3] Generate Solution
    │    └→ Create optimization proposal
    │         ↓
    └→ [Reflection Loop - max 3회]
         ├→ Test in staging DB
         ├→ Check performance (EXPLAIN)
         └→ Refine if needed
              ↓
         Create Jira + Slack alert
```

## 6. 다음 액션

- [ ] 즉시 프로토타입 (>40점)
- [X] 조건부 진행 (30-40점) - 리스크: 복잡한 쿼리 분석, DBA 지식 필요
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. 과거 slow query 10개 수집 (DBA 최적화 이력 포함)
2. 단순한 케이스부터 프로토타입 (인덱스 누락)
3. DBA와 "최적화 패턴 라이브러리" 구축

### 필요한 리소스:
- 데이터: 과거 slow query + DBA 해결 방법 (20-30건)
- 인력: 개발자 1명 + DBA 1명 (3주)
- 예산: Lambda + RDS (테스트 DB) + Bedrock API (월 $100)

## 7. 예상 타임라인

- Week 1-2: 단순 케이스 프로토타입 (인덱스 제안)
- Week 3-4: 복잡한 케이스 (쿼리 재작성)
- Week 5: Reflection loop 구현 및 테스트
- Week 6-8: 프로덕션 파일럿 (모니터링)

## 8. 메모 & 질문사항

- DBA 팀의 최적화 패턴 문서화되어 있는지?
- 테스트 DB가 프로덕션과 동일한 데이터/스키마인지?
- 자동으로 인덱스 추가까지 할 것인지 아니면 제안만?
- 복잡한 비즈니스 로직 쿼리는 제외하는 것이 안전

**Risk Level**: 🟡 MEDIUM - DBA 전문 지식 필요, 복잡도 높음
**Expected ROI**: DBA 시간 50% 절감 (월 40시간), 시스템 성능 개선
```

---

## Case 6: 소셜미디어 콘텐츠 자동 생성

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: SocialBuzz Agency
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"클라이언트 5개사의 SNS 콘텐츠를 매일 만들어야 하는데
각 회사별로 톤, 주제, 포맷이 달라서 하루 3시간 소요돼요.
회사별 가이드라인 맞춰서 자동으로 생성하고 싶어요."

## 2. Decomposition

### INPUT
- [ ] 이벤트형  [X] 스케줄형  [X] 요청형  [ ] 스트리밍  [ ] 조건부
- 구체적으로: 
  - 매일 오전 8시 (5개사)
  - 즉시 생성 (Slack 명령)

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? 
  - 업계 뉴스 (News API)
  - 트렌드 키워드 (Google Trends)
  - 회사 브랜드 가이드라인 (S3)
- [ ] 분석/분류 - 기준은? N/A
- [X] 판단/평가 - 기준은? 주제 적합성, 브랜드 fit
- [X] 콘텐츠 생성 - 무엇을? 
  - SNS 포스트 (Instagram, LinkedIn, Twitter)
  - 해시태그
  - 이미지 prompt (DALL-E 입력용)
- [X] 검증/개선 - 어떻게? 
  - 브랜드 가이드라인 준수 확인
  - 톤&매너 체크
  - 금지 단어 체크
  - 다시 작성 (max 3회)
- [X] 실행/연동 - 어디에? Notion database 저장, Slack 알림

### OUTPUT
- [ ] 의사결정  [X] 콘텐츠  [X] 알림  [ ] 액션  [ ] 인사이트
- 구체적으로: 
  - 3개 플랫폼 × 5개사 = 15개 포스트
  - Notion 페이지

### HUMAN-IN-LOOP
- [ ] None  [X] Review  [ ] Exception  [ ] Collaborate
- 이유: 마케터가 검토 후 실제 발행

## 3. Pattern Selection

- [ ] **Tool Use**
- [X] **Planning** (순차적)
- [ ] **Multi-Agent**
- [X] **Reflection** (콘텐츠 품질 개선)

선택 이유:
- Planning: 뉴스 수집 → 주제 선정 → 콘텐츠 생성
- Reflection: 브랜드 가이드라인 체크 → 수정 (2-3회)
- 각 회사별로 독립적이지만 동일 프로세스 반복

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 9 | News API, Google Trends, S3 |
| Decision Clarity | 7 | "좋은 콘텐츠" 기준이 주관적 |
| Error Tolerance | 9 | 사람이 검토 후 발행 |
| Latency | 10 | 30분 이내 OK |
| Integration | 8 | Notion, Slack, News API |
| **Total** | **43/50** | |

## 5. Quick Architecture Sketch

```
EventBridge (매일 08:00) or Slack Command
    ↓
Step Functions (5개사 순차 or 병렬)
    ↓
For each company:
    ├→ [Planning Phase 1] Trend Collection
    │    ├→ News API
    │    └→ Google Trends
    │         ↓
    ├→ [Planning Phase 2] Topic Selection
    │    └→ Filter by brand relevance
    │         ↓
    ├→ [Planning Phase 3] Content Generation
    │    └→ Generate 3 posts (Bedrock Sonnet)
    │         ↓
    └→ [Reflection Loop - max 3회]
         ├→ Brand Guideline Check
         ├→ Tone & Manner Check
         └→ Refine if needed
              ↓
         Save to Notion + Slack notification
```

## 6. 다음 액션

- [X] 즉시 프로토타입 (>40점)
- [ ] 조건부 진행 (30-40점)
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. 1개 회사로 프로토타입 (브랜드 가이드라인 입력)
2. 좋은 콘텐츠 예시 10개 수집
3. Reflection 체크리스트 작성 (톤, 길이, 해시태그 등)

### 필요한 리소스:
- 데이터: 각 회사별 브랜드 가이드라인, 과거 승인된 콘텐츠
- 인력: 개발자 1명 (1주)
- 예산: Lambda + Bedrock API + News API (월 $80)

## 7. 예상 타임라인

- Week 1: 1개사 프로토타입 + Reflection loop
- Week 2: 5개사로 확장, Notion 연동
- Week 3: 마케터 피드백 반영, 품질 개선
- Week 4: 프로덕션 배포

## 8. 메모 & 질문사항

- 브랜드 가이드라인이 문서화되어 있는지? (없으면 먼저 작성)
- 이미지 생성도 자동화할 것인지? (DALL-E 연동)
- 발행 스케줄도 자동화? (지금은 콘텐츠 생성만)
- 과거 승인/거절 데이터로 학습 가능

**Risk Level**: 🟢 LOW - 사람 검토 있고, 브랜드 리스크 관리 가능
**Expected ROI**: 마케터 15시간/주 절감
```

---

## Case 7: 계약서 자동 비교 및 리스크 플래그

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: LegalTech Solutions
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"고객사 계약서를 우리 표준 계약서와 비교해서 
차이점과 리스크를 찾는데 법무팀이 계약당 2시간씩 써요.
대부분 반복되는 패턴인데 자동화하고 싶어요."

## 2. Decomposition

### INPUT
- [X] 이벤트형  [ ] 스케줄형  [X] 요청형  [ ] 스트리밍  [ ] 조건부
- 구체적으로: 
  - DocuSign 계약서 업로드 시
  - 법무팀 Slack 명령

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? 
  - 고객 계약서 (PDF)
  - 표준 계약서 템플릿 (S3)
  - 과거 리스크 사례 (DynamoDB)
- [X] 분석/분류 - 기준은? 조항별 분류 (책임, 배상, IP, 기밀유지 등)
- [X] 판단/평가 - 기준은? 
  - 차이점 식별
  - 리스크 레벨 (High/Medium/Low)
  - 협상 가능성
- [X] 콘텐츠 생성 - 무엇을? 
  - 비교 리포트
  - 리스크 요약
  - 협상 포인트 제안
- [ ] 검증/개선 - 어떻게? N/A
- [X] 실행/연동 - 어디에? 
  - S3 리포트 저장
  - 법무팀 이메일
  - Salesforce 기회 업데이트

### OUTPUT
- [X] 의사결정  [X] 콘텐츠  [X] 알림  [ ] 액션  [X] 인사이트
- 구체적으로: 
  - 비교 리포트 (PDF)
  - 리스크 스코어
  - 협상 우선순위

### HUMAN-IN-LOOP
- [ ] None  [X] Review  [ ] Exception  [ ] Collaborate
- 이유: 법무팀 최종 검토 필수 (법률 리스크)

## 3. Pattern Selection

- [ ] **Tool Use**
- [X] **Planning** (순차 분석)
- [ ] **Multi-Agent**
- [ ] **Reflection**

선택 이유:
- 명확한 3단계: 파싱 → 비교 → 리스크 평가 → 리포트 생성
- 각 단계가 이전 결과에 의존
- Reflection 불필요 (법무팀이 최종 검토)

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 8 | PDF 파싱, S3 템플릿 |
| Decision Clarity | 6 | 법률 해석 복잡, 과거 사례 필요 |
| Error Tolerance | 6 | 법률 리스크 높음, 보수적 접근 |
| Latency | 9 | 1시간 이내 OK |
| Integration | 8 | DocuSign, S3, Salesforce, Email |
| **Total** | **37/50** | |

## 5. Quick Architecture Sketch

```
DocuSign Webhook or Slack Command
    ↓
Step Functions
    ├→ Phase 1: Document Parsing
    │    ├→ Customer Contract (PDF → Text)
    │    └→ Standard Template (S3)
    │         ↓
    ├→ Phase 2: Clause Extraction
    │    └→ Identify clauses (Bedrock Sonnet)
    │         ↓
    ├→ Phase 3: Comparison & Risk Analysis
    │    ├→ Compare clause by clause
    │    ├→ Flag differences
    │    └→ Assess risk level
    │         ↓
    └→ Phase 4: Report Generation
         ├→ Generate comparison report (PDF)
         └→ Send to legal team (Email + Salesforce)
```

## 6. 다음 액션

- [ ] 즉시 프로토타입 (>40점)
- [X] 조건부 진행 (30-40점) - 리스크: 법률 해석, 과거 데이터 필요
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. 과거 계약서 10-20건 수집 (법무팀 리뷰 포함)
2. 표준 템플릿 디지털화 (조항별 분해)
3. "리스크 조항" 패턴 정의 (법무팀과 협업)

### 필요한 리소스:
- 데이터: 표준 템플릿, 과거 계약서 + 리뷰 (20건)
- 인력: 개발자 1명 + 법무 담당자 1명 (2주)
- 예산: Lambda + Bedrock API (월 $60)

## 7. 예상 타임라인

- Week 1: PDF 파싱 + 조항 추출 로직
- Week 2: 비교 알고리즘 + 리스크 평가
- Week 3: 리포트 생성, 법무팀 피드백
- Week 4: 프로덕션 파일럿 (5건 테스트)

## 8. 메모 & 질문사항

- 표준 템플릿이 여러 버전 있는지? (SaaS vs Enterprise)
- 법무팀의 리뷰 시간을 얼마나 줄이는 것이 목표? (2시간 → 30분?)
- 계약서 유형별로 다른 로직 필요? (NDA, MSA, SLA 등)
- GDPR: 고객사 계약서 저장 시 보안 요구사항

**Risk Level**: 🟡 MEDIUM - 법률 해석 복잡도, 보수적 접근 필요
**Expected ROI**: 법무팀 시간 60% 절감 (월 80시간)
```

---

## Case 8: 고객 이탈 예측 및 리텐션 캠페인

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: SubscriptionCo
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"월 구독 고객 중 이탈 위험이 높은 사람을 찾아서 
리텐션 캠페인을 하고 싶은데, 수동으로 하다 보니 
이미 떠난 후에 발견하는 경우가 많아요."

## 2. Decomposition

### INPUT
- [ ] 이벤트형  [X] 스케줄형  [ ] 요청형  [ ] 스트리밍  [ ] 조건부
- 구체적으로: 매일 오전 8시 (전일 데이터 분석)

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? 
  - 사용 로그 (Amplitude/Mixpanel)
  - 고객 프로필 (CRM)
  - 지원 티켓 (Zendesk)
  - 결제 히스토리 (Stripe)
- [X] 분석/분류 - 기준은? 
  - 행동 패턴 (로그인 빈도, 기능 사용)
  - 감정 (지원 티켓 톤)
  - 결제 이력
- [X] 판단/평가 - 기준은? 
  - 이탈 확률 (0-100%)
  - 이탈 이유 추정
  - 리텐션 우선순위
- [X] 콘텐츠 생성 - 무엇을? 
  - 고객별 맞춤 이메일
  - 할인 제안 (규칙 기반)
- [ ] 검증/개선 - 어떻게? N/A
- [X] 실행/연동 - 어디에? 
  - SendGrid (이메일 발송)
  - CRM 태그 업데이트
  - CSM 팀 Slack 알림 (High risk만)

### OUTPUT
- [X] 의사결정  [X] 콘텐츠  [X] 알림  [X] 액션  [X] 인사이트
- 구체적으로: 
  - 이탈 위험 스코어
  - 맞춤 이메일
  - CSM 알림

### HUMAN-IN-LOOP
- [X] None  [ ] Review  [X] Exception  [ ] Collaborate
- 이유: 
  - Low/Medium risk: 자동 이메일 발송
  - High risk: CSM 직접 연락

## 3. Pattern Selection

- [ ] **Tool Use**
- [X] **Planning** (순차 분석)
- [X] **Multi-Agent** (병렬 데이터 수집)
- [ ] **Reflection**

선택 이유:
- Multi-Agent: 4개 소스 병렬 수집 (Amplitude, CRM, Zendesk, Stripe)
- Planning: 데이터 통합 → 분석 → 스코어링 → 캠페인 생성

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 9 | 모든 시스템 API 존재 |
| Decision Clarity | 7 | 이탈 예측 모델 필요, 과거 데이터로 학습 |
| Error Tolerance | 8 | False positive 괜찮음 (이메일 받아도 무해) |
| Latency | 10 | 배치 처리, 1시간 OK |
| Integration | 6 | 4개 시스템 연동 |
| **Total** | **40/50** | |

## 5. Quick Architecture Sketch

```
EventBridge (매일 08:00)
    ↓
Step Functions
    ├→ [Multi-Agent] Parallel Data Collection
    │    ├→ AmplitudeAgent (usage data)
    │    ├→ CRMAgent (customer profile)
    │    ├→ ZendeskAgent (support tickets)
    │    └→ StripeAgent (payment history)
    │         ↓
    ├→ [Planning] Data Aggregation
    │    └→ Merge all data by customer_id
    │         ↓
    ├→ [Planning] Churn Prediction
    │    └→ Calculate churn score (Bedrock Sonnet)
    │         ↓
    ├→ [Planning] Segmentation
    │    ├→ High risk (>80)
    │    ├→ Medium risk (50-80)
    │    └→ Low risk (<50)
    │         ↓
    └→ [Execution] Campaign
         ├→ High: Slack to CSM
         ├→ Medium: Personalized email (discount)
         └→ Low: Generic email (engagement)
```

## 6. 다음 액션

- [X] 즉시 프로토타입 (>40점)
- [ ] 조건부 진행 (30-40점)
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. 과거 이탈 고객 100명 데이터 분석 (패턴 파악)
2. Churn prediction 알고리즘 프로토타입 (룰베이스 먼저)
3. 이메일 템플릿 3개 작성 (High/Medium/Low)

### 필요한 리소스:
- 데이터: 과거 1년 이탈 고객 + 행동 로그
- 인력: 개발자 1명 + 데이터 분석가 1명 (2주)
- 예산: Lambda + API 호출 (월 $100)

## 7. 예상 타임라인

- Week 1: 데이터 수집 + 간단한 스코어링 (룰베이스)
- Week 2: ML 모델 추가 (이탈 예측 정확도 향상)
- Week 3: 캠페인 로직 + 이메일 발송
- Week 4: A/B 테스트, 효과 측정

## 8. 메모 & 질문사항

- 현재 이탈률은? 목표 감소율은? (10% → 7%)
- 과거 리텐션 캠페인 효과 데이터 있는지?
- 할인 제공 예산 범위는?
- GDPR: 이메일 발송 동의 확인

**Risk Level**: 🟢 LOW - False positive 괜찮고, 실험 가능
**Expected ROI**: 이탈률 30% 감소 (월 $50K MRR 보존)
```

---

## Case 9: 회의록 자동 생성 + 액션 아이템 추적

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: ProductTeam Inc.
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"주간 회의가 10개인데, 매번 회의록 작성하고 
액션 아이템을 Jira에 등록하는데 회의당 30분씩 걸려요.
자동으로 회의록 만들고 티켓까지 생성하고 싶어요."

## 2. Decomposition

### INPUT
- [X] 이벤트형  [ ] 스케줄형  [ ] 요청형  [ ] 스트리밍  [ ] 조건부
- 구체적으로: Zoom/Teams 녹화 종료 시 webhook

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? 
  - 음성 녹화 (Zoom API)
  - 화면 공유 (optional)
  - 참석자 목록
- [X] 분석/분류 - 기준은? 
  - STT (Speech-to-Text)
  - Speaker diarization
  - 주요 논의 사항 분류
  - 결정 사항 식별
  - 액션 아이템 추출 (담당자, 기한)
- [ ] 판단/평가 - 기준은? N/A
- [X] 콘텐츠 생성 - 무엇을? 
  - 회의록 (Notion 문서)
  - 액션 아이템 리스트
- [ ] 검증/개선 - 어떻게? N/A
- [X] 실행/연동 - 어디에? 
  - Notion 페이지 생성
  - Jira 티켓 생성
  - Slack 요약 발송

### OUTPUT
- [ ] 의사결정  [X] 콘텐츠  [X] 알림  [X] 액션  [ ] 인사이트
- 구체적으로: 
  - Notion 회의록
  - Jira 티켓
  - Slack 요약

### HUMAN-IN-LOOP
- [ ] None  [X] Review  [ ] Exception  [ ] Collaborate
- 이유: 회의 주최자가 회의록 검토 후 확정

## 3. Pattern Selection

- [ ] **Tool Use**
- [X] **Planning** (명확한 순차 처리)
- [ ] **Multi-Agent**
- [ ] **Reflection**

선택 이유:
- 명확한 파이프라인: STT → 분석 → 회의록 생성 → 티켓 생성
- 각 단계가 이전 결과 의존
- 복잡도 낮음 (Reflection 불필요)

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 10 | Zoom API, 녹화 파일 S3 |
| Decision Clarity | 8 | 액션 아이템 식별 기준 필요 |
| Error Tolerance | 9 | 회의 주최자 검토 |
| Latency | 8 | 회의 후 30분 이내 |
| Integration | 7 | Zoom, Notion, Jira, Slack |
| **Total** | **42/50** | |

## 5. Quick Architecture Sketch

```
Zoom Webhook (recording complete)
    ↓
Step Functions
    ├→ Phase 1: STT Processing
    │    └→ AWS Transcribe (음성 → 텍스트)
    │         ↓
    ├→ Phase 2: Analysis
    │    ├→ Speaker diarization
    │    ├→ Extract key points
    │    ├→ Identify decisions
    │    └→ Extract action items (Bedrock Sonnet)
    │         ↓
    ├→ Phase 3: Content Generation
    │    ├→ Create meeting notes (structured)
    │    └→ Format action items
    │         ↓
    └→ Phase 4: Integration
         ├→ Notion API (create page)
         ├→ Jira API (create tickets)
         └→ Slack (send summary)
```

## 6. 다음 액션

- [X] 즉시 프로토타입 (>40점)
- [ ] 조건부 진행 (30-40점)
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. 과거 녹화 파일 3개로 STT 테스트 (AWS Transcribe)
2. 액션 아이템 추출 prompt 엔지니어링
3. Notion 템플릿 디자인

### 필요한 리소스:
- 데이터: 과거 회의 녹화 5개 (수동 회의록 포함)
- 인력: 개발자 1명 (1주)
- 예산: Transcribe + Lambda + Bedrock API (월 $50)

## 7. 예상 타임라인

- Week 1: STT + 간단한 회의록 생성
- Week 2: 액션 아이템 추출 + Jira 연동
- Week 3: Notion 템플릿 개선, Slack 요약
- Week 4: 프로덕션 배포, 팀 피드백

## 8. 메모 & 질문사항

- Zoom 외에 Teams, Google Meet도 지원해야 하는지?
- 한국어 STT 품질 확인 필요 (AWS Transcribe 한국어 지원)
- 회의록 포맷 샘플 필요
- 액션 아이템 담당자 자동 배정 로직 (이름 인식)

**Risk Level**: 🟢 LOW - STT 품질만 확보되면 안전
**Expected ROI**: 회의당 30분 절감 (주 10회 = 5시간/주)
```

---

## Case 10: 재고 최적화 및 발주 추천

```markdown
# AI Agent Design Worksheet

Date: 2024-12-13
Customer: RetailCo
Interviewed by: Solutions Architect

## 1. PROBLEM (고객 pain point)

"SKU 300개 관리하는데, 품절로 판매 기회 놓치거나
과재고로 폐기하는 경우가 많아요. 발주 시점과 수량을
데이터 기반으로 추천받고 싶어요."

## 2. Decomposition

### INPUT
- [ ] 이벤트형  [X] 스케줄형  [X] 요청형  [ ] 스트리밍  [ ] 조건부
- 구체적으로: 
  - 매일 오전 8시 (정기)
  - 구매팀 요청 시 (즉시 분석)

### PROCESS (체크 및 설명)
- [X] 데이터 수집 - 어디서? 
  - 판매 데이터 (POS, 지난 3개월)
  - 재고 현황 (ERP)
  - 공급업체 리드타임 (Supplier DB)
  - 외부 요인 (날씨 API, 휴일 달력, 프로모션 일정)
- [X] 분석/분류 - 기준은? 
  - 판매 트렌드 분석
  - 계절성 패턴
  - 이상치 탐지 (프로모션, 이벤트)
- [X] 판단/평가 - 기준은? 
  - 재고 부족 리스크 (0-100%)
  - 최적 발주 시점
  - 추천 발주 수량
- [X] 콘텐츠 생성 - 무엇을? 
  - 발주 추천 리스트
  - 위험 SKU 리스트
- [ ] 검증/개선 - 어떻게? N/A
- [X] 실행/연동 - 어디에? 
  - ERP 발주 제안 입력
  - 구매팀 이메일
  - Slack 알림

### OUTPUT
- [X] 의사결정  [X] 콘텐츠  [X] 알림  [ ] 액션  [X] 인사이트
- 구체적으로: 
  - 발주 추천 (SKU, 수량, 시점)
  - 품절 위험 SKU
  - 과재고 경고

### HUMAN-IN-LOOP
- [ ] None  [X] Review  [ ] Exception  [ ] Collaborate
- 이유: 구매팀이 최종 발주 결정

## 3. Pattern Selection

- [ ] **Tool Use**
- [ ] **Planning**
- [X] **Multi-Agent** (병렬 분석)
- [ ] **Reflection**

선택 이유:
- Multi-Agent: 4가지 분석을 병렬 실행
  - SalesAnalyzer (과거 판매)
  - SeasonalityAnalyzer (계절 패턴)
  - ExternalFactorAnalyzer (날씨, 휴일)
  - SupplierAgent (리드타임)
- Master agent가 결과 통합 및 발주 추천

## 4. Feasibility Score

| 항목 | 점수 (/10) | 메모 |
|------|-----------|------|
| Data Access | 8 | POS, ERP API, 날씨 API |
| Decision Clarity | 7 | 수요 예측 모델 필요 |
| Error Tolerance | 8 | 과발주는 괜찮음, 품절만 피하면 됨 |
| Latency | 10 | 1시간 OK |
| Integration | 6 | POS, ERP, Supplier DB, Weather API |
| **Total** | **39/50** | |

## 5. Quick Architecture Sketch

```
EventBridge (매일 08:00) or Slack Command
    ↓
Step Functions
    ├→ [Multi-Agent] Parallel Analysis
    │    ├→ SalesAnalyzer (3개월 판매 데이터)
    │    ├→ SeasonalityAnalyzer (작년 동기 대비)
    │    ├→ ExternalFactorAnalyzer (날씨, 휴일, 프로모션)
    │    └→ SupplierAgent (리드타임 조회)
    │         ↓
    ├→ [Aggregation] Master Orchestrator
    │    ├→ Merge all insights
    │    ├→ Calculate stock-out risk
    │    └→ Generate recommendations (Bedrock Sonnet)
    │         ↓
    └→ [Output] Integration
         ├→ ERP (발주 제안 입력)
         ├→ Email (구매팀)
         └→ Slack (요약)
```

## 6. 다음 액션

- [ ] 즉시 프로토타입 (>40점)
- [X] 조건부 진행 (30-40점) - 리스크: 수요 예측 정확도
- [ ] 데이터 정제 후 재평가 (20-30점)
- [ ] 대안 모색 (<20점)

### 즉각적 Next Steps:
1. 과거 1년 판매 데이터 분석 (패턴 파악)
2. 간단한 룰베이스 추천 로직 (안전재고 + 리드타임)
3. Top 20 SKU로 프로토타입

### 필요한 리소스:
- 데이터: 과거 1년 판매, 재고, 발주 이력
- 인력: 개발자 1명 + 구매 담당자 1명 (2주)
- 예산: Lambda + Bedrock API (월 $80)

## 7. 예상 타임라인

- Week 1-2: 룰베이스 프로토타입 (Top 20 SKU)
- Week 3: ML 모델 추가 (수요 예측)
- Week 4: 전체 SKU 확장, ERP 연동
- Week 5-8: 모니터링, 정확도 개선

## 8. 메모 & 질문사항

- 현재 품절률과 과재고율은? 목표는?
- 구매팀의 발주 의사결정 기준은?
- 공급업체별 최소 발주 수량(MOQ) 있는지?
- 계절 상품 vs 연중 상품 비율

**Risk Level**: 🟡 MEDIUM - 수요 예측 정확도에 따라 성패 결정
**Expected ROI**: 품절 50% 감소 + 과재고 30% 감소 (월 $20K 절감)
```

---

## 📊 10개 워크시트 요약 비교

| # | 시나리오 | 패턴 | Score | INPUT | 난이도 | ROI | 개발 |
|---|---------|------|-------|-------|-------|-----|------|
| 1 | Slack 봇 정보 조회 | Tool Use | 48 | 요청형 | ⭐ | ⭐⭐ | 3일 |
| 2 | 이상 거래 탐지 | Planning | 33 | 스트리밍 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 2주 |
| 3 | 경쟁사 분석 리포트 | Multi-Agent | 40 | 스케줄형 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 1.5주 |
| 4 | 면접 질문 생성 | Multi+Reflection | 39 | 이벤트형 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 2주 |
| 5 | DB 쿼리 최적화 | Planning+Reflection | 34 | 조건부 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 3주 |
| 6 | SNS 콘텐츠 생성 | Planning+Reflection | 43 | 스케줄형 | ⭐⭐ | ⭐⭐⭐⭐⭐ | 1주 |
| 7 | 계약서 비교 | Planning | 37 | 이벤트형 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 2주 |
| 8 | 이탈 예측 캠페인 | Multi+Planning | 40 | 스케줄형 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 2주 |
| 9 | 회의록 자동화 | Planning | 42 | 이벤트형 | ⭐⭐ | ⭐⭐⭐⭐⭐ | 1주 |
| 10 | 재고 최적화 | Multi-Agent | 39 | 스케줄형 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 2주 |

---

## 🎯 패턴별 분포

```yaml
Tool Use: 1건 (10%)
  - #1 Slack 봇

Planning: 3건 (30%)
  - #2 이상 거래 탐지
  - #7 계약서 비교
  - #9 회의록 자동화

Multi-Agent: 3건 (30%)
  - #3 경쟁사 분석
  - #8 이탈 예측
  - #10 재고 최적화

복합 패턴: 3건 (30%)
  - #4 Multi + Reflection
  - #5 Planning + Reflection
  - #6 Planning + Reflection
```

---

## 💡 워크시트 사용 팁

### 1. 고객 미팅 중 실시간 작성
```
1. 문제 들으면서 INPUT 타입 체크
2. "어떤 작업을 하나요?" → PROCESS 체크
3. "결과물이 뭔가요?" → OUTPUT 체크
4. 즉석에서 Feasibility 점수 계산
5. 패턴 추천 및 Next Steps 제안
```

### 2. 팀 리뷰용
```
- 워크시트를 Notion/Confluence에 복사
- 팀원들이 Feasibility 점수 각자 매기기
- 평균 내서 객관적 평가
- Risk 섹션 함께 브레인스토밍
```

### 3. 고객 제안서 첨부
```
- 워크시트 → PDF 변환
- "20분 만에 분석한 결과입니다" 강조
- Feasibility Score를 신뢰도 지표로 활용
- Next Steps를 제안서 타임라인으로 사용
```

어떤 워크시트를 더 상세히 보고 싶으신가요? 실제 코드나 프로토타입 작성해드릴까요?