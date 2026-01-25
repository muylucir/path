# AgentCore Browser Tool

## 개념

AgentCore Browser Tool은 AI 에이전트가 실시간으로 웹을 탐색하고 상호작용할 수 있게 하는 완전 관리형 브라우저 환경입니다.

**핵심 가치:**
- **실시간 웹 탐색**: 최신 정보 확보, 동적 콘텐츠 접근
- **격리된 보안 환경**: ECS Fargate 기반 컨테이너
- **시각적 감사**: DCV를 통한 실시간 브라우저 관찰

**AI의 외부 세계 접촉:**
- Code Interpreter가 내부 데이터를 분석한다면, Browser Tool은 외부 데이터를 관찰하고 수집
- AI를 "닫힌 언어 모델"에서 "열린 관찰자(Open Observer)"로 전환
- 모든 행동이 기록되고 통제되는 안전한 구조

## 핵심 기술

### 1. CDP (Chrome DevTools Protocol)
Chromium 기반 브라우저를 원격으로 제어하기 위한 저수준 프로토콜:
- DOM, 네트워크, 콘솔 등 30개 이상 도메인 API
- WebSocket 기반 통신
- 브라우저 내부 상태를 실시간으로 읽고 제어

### 2. Playwright/Puppeteer
CDP 위에서 동작하는 고수준 자동화 라이브러리:
- 클릭, 입력, 스크린샷 등 브라우저 조작
- LLM의 고수준 명령을 CDP 명령으로 변환
- AgentCore는 Playwright Adapter 사용

### 3. Amazon DCV (Desktop Cloud Visualization)
고성능 원격 그래픽 스트리밍 프로토콜:
- AI 브라우저 행동의 시각적 감사
- 운영자가 실시간으로 브라우저 상태 확인
- TLS 암호화, 60fps 수준 렌더링

## 동작 흐름

```
자연어 쿼리 → LLM 계획 수립 → 구조화된 명령 → CDP 실행 → 결과 반환
```

1. **의도 분석**: LLM이 사용자 요청 분석, 단계별 계획 수립
   - "아마존 웹사이트로 이동 → 검색창 찾기 → '신발' 입력 → 엔터"

2. **명령 변환**: 구조화된 도구 호출 → Playwright 추상 계층 매핑
   - "클릭" → `page.click()` API

3. **CDP 실행**: WebSocket으로 브라우저 명령 전달
   - Playwright가 CDP 명령으로 변환하여 실행

4. **결과 반환**: 스크린샷과 상태 정보를 LLM에 전달
   - 모델은 이 데이터를 바탕으로 후속 추론

## 아키텍처 구성 요소

| 구성 요소 | 역할 |
|----------|------|
| **Session Manager** | ECS Fargate 기반 브라우저 세션 생성/관리 |
| **Playwright Adapter** | LLM 명령 → CDP 명령 변환 |
| **DCV Renderer** | 브라우저 화면 실시간 스트리밍 |
| **Audit Logger** | CloudTrail 연동, 모든 세션 이벤트 기록 |

## 사용 패턴

### 패턴 1: Playwright 단독

개발자가 직접 Playwright 코드를 작성하여 브라우저 제어:

```python
from bedrock_agentcore.tools.browser import browser_session, BrowserViewerServer
from playwright.sync_api import sync_playwright

with browser_session("us-west-2") as client:
    ws_url, headers = client.generate_ws_headers()

    # DCV Live View (선택)
    viewer = BrowserViewerServer(client, port=8005)
    viewer_url = viewer.start(open_browser=True)

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(ws_url, headers=headers)
        page = browser.contexts[0].pages[0]

        page.goto("https://amazon.com")
        page.get_by_role("searchbox").fill("running shoes")
        page.keyboard.press("Enter")
```

**특징:**
- 기존 Playwright 스크립트 재사용 가능
- SigV4 인증 기반 안전한 제어
- 예측 가능성과 유지보수성 중시 환경에 적합

### 패턴 2: Nova Act + Browser Tool

**Amazon Nova Act**는 자연어 명령을 브라우저 행동으로 변환하는 AI 에이전트입니다.

```python
from nova_act import NovaAct

with browser_session("us-west-2") as client:
    ws_url, headers = client.generate_ws_headers()

    with NovaAct(
        cdp_endpoint_url=ws_url,
        cdp_headers=headers,
        nova_act_api_key=NOVA_ACT_API_KEY,
        starting_page="https://www.amazon.com",
    ) as nova_act:
        result = nova_act.act("Search for coffee makers and find the cheapest one.")
```

**Nova Act SDK 설치:**
```bash
pip install nova-act
```

**Nova Act 주요 기능:**

| 기능 | 설명 |
|------|------|
| `act()` | 자연어 명령 실행 |
| `observe()` | 현재 페이지 상태 분석 |
| `screenshot()` | 스크린샷 캡처 |
| `get_page_content()` | 페이지 HTML 추출 |

**복잡한 작업 체인:**
```python
with NovaAct(
    cdp_endpoint_url=ws_url,
    cdp_headers=headers,
    nova_act_api_key=NOVA_ACT_API_KEY,
    starting_page="https://www.example.com",
) as nova_act:
    # 1단계: 로그인
    nova_act.act("Click the login button and enter username 'test@example.com'")

    # 2단계: 검색
    nova_act.act("Search for 'laptop' in the search bar")

    # 3단계: 필터 적용
    nova_act.act("Filter by price under $1000 and sort by rating")

    # 4단계: 결과 추출
    result = nova_act.observe("List the top 5 products with their prices")
```

**특징:**
- Playwright API를 직접 다루지 않아도 됨
- 단일 자연어 지시 → 완전한 브라우저 작업
- 반복적인 UI 업무 자동화에 적합

### 패턴 3: Strands + Nova Act

Strands가 의사결정, Nova Act가 브라우저 제어 담당:

```python
from strands import Agent, tool

@tool
def browser_automation_tool(starting_url: str, instructions: str) -> str:
    """Execute browser automation using Nova Act."""
    with browser_session("us-west-2") as client:
        ws_url, headers = client.generate_ws_headers()
        with NovaAct(
            cdp_endpoint_url=ws_url,
            cdp_headers=headers,
            nova_act_api_key=NOVA_ACT_API_KEY,
            starting_page=starting_url,
        ) as nova_act:
            return str(nova_act.act(instructions))

# Supervisor Agent가 필요할 때 도구 호출
agent = Agent(tools=[browser_automation_tool])
result = agent("아마존에서 가장 저렴한 커피 메이커를 찾아줘")
```

**특징:**
- 멀티에이전트 시스템에서 브라우저 자동화 통합
- Strands가 고수준 의사결정, Nova Act가 실행 담당
- 대규모 에이전트 생태계에 적합

### 패턴 4: Browser Use

복잡한 멀티스텝 웹 탐색을 자동화:

```python
from browser_use import BrowserSession, BrowserProfile, BrowserUseAgent
from browser_use.llm import ChatBedrockClaude
from bedrock_agentcore.tools.browser import BrowserClient

client = BrowserClient(region="us-west-2")
client.start()

ws_url, headers = client.generate_ws_headers()

browser_session = BrowserSession(
    cdp_url=ws_url,
    browser_profile=BrowserProfile(headers=headers),
    keep_alive=True,
)
await browser_session.start()

bedrock_chat = ChatBedrockClaude(
    model_id="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    region="us-west-2",
)

agent = BrowserUseAgent(
    task="Find the cheapest coffee maker on Amazon.",
    llm=bedrock_chat,
    browser_session=browser_session,
)

result = await agent.run()
```

**특징:**
- 멀티 페이지 이동, 복잡한 입력 폼 처리
- LLM이 페이지 상태를 판단하며 다음 행동 결정
- 대규모 웹 기반 운영 시스템, 승인 절차 자동화에 적합

## Session Recording & Replay

브라우저 세션을 녹화하여 나중에 재생하거나 디버깅에 활용할 수 있습니다.

### Recording 활성화

```python
from bedrock_agentcore.tools.browser import browser_session, RecordingConfig

# S3에 녹화 저장
recording_config = RecordingConfig(
    enabled=True,
    s3_bucket="my-browser-recordings",
    s3_prefix="sessions/",
    include_screenshots=True,
    screenshot_interval_ms=1000  # 1초마다 스크린샷
)

with browser_session("us-west-2", recording_config=recording_config) as client:
    ws_url, headers = client.generate_ws_headers()

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp(ws_url, headers=headers)
        page = browser.contexts[0].pages[0]

        page.goto("https://example.com")
        page.click("#button")

    # 세션 종료 시 자동으로 S3에 업로드
```

### Recording 구조

S3에 저장되는 녹화 데이터:

```
s3://my-browser-recordings/sessions/{session_id}/
├── metadata.json          # 세션 메타데이터
├── events.jsonl           # CDP 이벤트 로그
├── screenshots/           # 스크린샷 디렉토리
│   ├── 0001.png
│   ├── 0002.png
│   └── ...
└── video.webm             # 세션 비디오 (선택)
```

### Recording 재생

```python
from bedrock_agentcore.tools.browser import BrowserRecordingPlayer

# 녹화 로드
player = BrowserRecordingPlayer(
    s3_bucket="my-browser-recordings",
    s3_key="sessions/{session_id}/"
)

# 메타데이터 조회
metadata = player.get_metadata()
print(f"Session duration: {metadata['duration_ms']}ms")
print(f"Total events: {metadata['event_count']}")

# 이벤트 재생
for event in player.replay_events():
    print(f"[{event['timestamp']}] {event['type']}: {event['data']}")
```

### 활용 사례

| 사례 | 설명 |
|------|------|
| **디버깅** | 실패한 자동화 작업의 원인 분석 |
| **감사** | AI 브라우저 행동 기록 및 검토 |
| **테스트** | 녹화된 세션을 테스트 케이스로 활용 |
| **교육** | 자동화 프로세스 시연 및 문서화 |

## DCV Live View

운영자가 AI 브라우저 행동을 실시간으로 관찰:

```python
from bedrock_agentcore.tools.browser import BrowserViewerServer

viewer = BrowserViewerServer(client, port=8005)
viewer_url = viewer.start(open_browser=True)
# 브라우저에서 viewer_url 접속하여 실시간 관찰
```

**제공 기능:**
- 실시간 브라우저 화면 스트리밍
- 클릭, 입력 등 모든 동작 관찰
- Explainable Automation 구현

**연구 배경:**
- AI 에이전트의 행동을 인간이 실시간으로 관찰할 수 있을 때 사용자 신뢰도가 유의미하게 향상
- AI 시스템의 투명성이 사용자 신뢰 형성에 직접적 영향

## Code Interpreter와의 연동

Browser Tool과 Code Interpreter는 상호 보완적:

```
Browser Tool (데이터 수집) → Code Interpreter (분석/검증) → 결과 시각화
```

**통합 루프:**
1. Browser Tool이 외부 데이터 수집 → JSON/CSV/HTML 저장
2. Code Interpreter가 데이터 분석, 통계 계산, 시각화
3. Browser Tool이 결과를 사용자에게 시각화

**인지 검증 시스템:**
- Perception (Browser Tool) → Cognition (Code Interpreter) → Verification (검증/피드백)
- "실행 가능한 신뢰(Executable Trust)" 구현

## 제약사항

| 항목 | 제한 |
|------|------|
| **세션 유지** | 기본 15분, 최대 8시간 |
| **동시 세션** | 계정당 10개 |
| **파일 다운로드** | 100MB |
| **모니터링** | CloudTrail 모든 세션 이벤트 기록 |
| **격리** | ECS Fargate 기반 컨테이너 |
| **인증** | SigV4 서명 기반 |
