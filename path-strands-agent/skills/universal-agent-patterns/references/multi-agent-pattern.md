# Multi-Agent Pattern (다중 에이전트 협업)

## 개념

Multi-Agent 패턴은 여러 전문화된 Agent가 협업하여 작업을 수행하는 방식입니다.

```
Task -> Coordinator -> Agent A, Agent B, Agent C -> Aggregation -> Result
```

## 핵심 구성 요소

### 1. Coordinator (조율자)
- 작업 분배
- Agent 선택
- 결과 통합

### 2. Specialized Agents (전문 에이전트)
- 특정 역할 전담
- 독립적 실행
- 결과 반환

### 3. Communication (통신)
- Agent 간 메시지 전달
- 상태 공유
- 협업 프로토콜

## 적합한 상황

| 상황 | 설명 |
|------|------|
| 다양한 전문성 | 서로 다른 역할이 필요 |
| 병렬 처리 | 독립적인 작업을 동시 수행 |
| 복잡한 워크플로우 | 여러 단계의 협업 필요 |

## 협업 패턴

### 1. Sequential (순차적)
```
Agent A -> Agent B -> Agent C
```
- 이전 Agent 결과가 다음 Agent 입력
- 파이프라인 구조

### 2. Parallel (병렬)
```
         +-> Agent A --+
Task --->+-> Agent B --+--> Aggregator
         +-> Agent C --+
```
- 독립적인 작업 동시 수행
- 결과 통합 필요

### 3. Hierarchical (계층적)
```
        Supervisor
       /    |    \
  Agent A Agent B Agent C
```
- 상위 Agent가 작업 분배 및 감독
- 하위 Agent가 실제 작업 수행

### 4. Peer-to-Peer (대등)
```
Agent A <--> Agent B
   ^           ^
   |           |
   +--> Agent C <--+
```
- 모든 Agent가 대등한 관계
- 필요 시 상호 협력

## State 관리

| State 유형 | 내용 | 예시 |
|-----------|------|------|
| **Shared State** | 모든 Agent가 접근 | 공통 데이터, 목표 |
| **Local State** | 개별 Agent 상태 | 진행 상황, 임시 데이터 |
| **Communication State** | 메시지 이력 | Agent 간 대화 기록 |

## 예제: 콘텐츠 제작 팀

### Agent 구성

```
Content Production Team
├── Researcher Agent
│   └── 주제 조사, 자료 수집
├── Writer Agent
│   └── 초안 작성
├── Editor Agent
│   └── 교정 및 편집
└── Designer Agent
    └── 시각 자료 생성
```

### System Prompt 예시

**Coordinator**
```
당신은 콘텐츠 제작 팀의 프로젝트 매니저입니다.

팀 구성원:
- Researcher: 주제 조사 담당
- Writer: 콘텐츠 작성 담당
- Editor: 교정 및 품질 관리 담당
- Designer: 시각 자료 담당

작업 요청을 받으면:
1. 필요한 팀원을 선택하세요
2. 작업을 분배하세요
3. 결과를 통합하세요
```

**Researcher Agent**
```
당신은 리서치 전문가입니다.

주어진 주제에 대해:
1. 관련 정보를 수집하세요
2. 핵심 포인트를 정리하세요
3. 참고 자료 목록을 제공하세요

결과는 구조화된 형식으로 제공하세요.
```

### 실행 흐름 예시

```
User: "AI 트렌드 블로그 글 작성해줘"

[Coordinator] 작업 분석 및 팀원 할당

[Researcher] AI 트렌드 조사
- 2024년 주요 AI 기술 트렌드
- 산업별 AI 적용 사례
- 전문가 의견 수집

[Writer] 블로그 초안 작성
- Researcher 자료 기반 글 작성
- 구조: 서론-본론-결론

[Editor] 교정 및 편집
- 문법, 맞춤법 검토
- 가독성 개선
- 최종 승인

[Coordinator] 결과 통합 및 전달

[Final Output] 완성된 블로그 글
```

## Agent 간 통신 방식

### Message Passing
```json
{
  "from": "researcher",
  "to": "writer",
  "type": "research_result",
  "content": {
    "topic": "AI 트렌드",
    "key_points": [...],
    "references": [...]
  }
}
```

### Shared Memory
```json
{
  "project_id": "blog-001",
  "stage": "writing",
  "artifacts": {
    "research": {...},
    "draft": {...}
  }
}
```

## 주의사항

1. **역할 명확화**: 각 Agent의 역할과 책임 명확히 정의
2. **통신 오버헤드**: Agent 간 통신 비용 고려
3. **동기화**: 병렬 작업 시 결과 통합 시점 관리
4. **실패 전파**: 한 Agent 실패가 전체에 미치는 영향 최소화
5. **확장성**: Agent 추가/제거가 용이하도록 설계
