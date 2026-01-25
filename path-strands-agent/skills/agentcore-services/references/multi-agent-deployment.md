# Multi-Agent 배포 모범 사례

## 1개의 Runtime으로 Multi-Agent 호스팅

**모범 사례**: Strands로 만든 Multi-Agent 시스템은 **Agent별로 Runtime을 분리하지 않고**, **1개의 Runtime에서 전체 Multi-Agent Graph를 호스팅**하는 것이 권장됩니다.

### 왜 1개의 Runtime을 사용해야 하는가?

| 측면 | 1개 Runtime (권장) | Agent별 Runtime (비권장) |
|------|-------------------|------------------------|
| **비용** | 1개 Runtime 요금만 발생 | Agent 개수만큼 Runtime 요금 발생 (N배) |
| **레이턴시** | Agent 간 메모리 내 통신 (밀리초) | HTTP 호출 오버헤드 (수백 밀리초) |
| **관리** | 단일 배포, 단일 버전 관리 | 여러 배포, 버전 동기화 필요 |
| **상태 공유** | Invocation State로 즉시 공유 | 외부 저장소 필요 |
| **트랜잭션** | Graph 전체가 하나의 실행 단위 | Agent 간 실패 처리 복잡 |

### 올바른 구현 예제

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.multiagent import GraphBuilder

app = BedrockAgentCoreApp()

# Multi-Agent Graph 구성
github_collector = Agent(
    model="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    name="github_collector",
    system_prompt="Collect GitHub data...",
    tools=[mcp_github]
)

resume_parser = Agent(
    model="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    name="resume_parser",
    system_prompt="Parse resume PDF...",
    tools=[pdf_tool]
)

analyzer = Agent(
    model="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
    name="analyzer",
    system_prompt="Analyze all collected data..."
)

# Graph 빌드
builder = GraphBuilder()
builder.add_node(github_collector, "github")
builder.add_node(resume_parser, "resume")
builder.add_node(analyzer, "analyzer")
builder.add_edge("github", "analyzer")
builder.add_edge("resume", "analyzer")
builder.set_entry_point("github")
multi_agent_graph = builder.build()

# 1개의 Runtime Entrypoint로 전체 Graph 실행
@app.entrypoint
def invoke(payload, context):
    user_input = payload.get("prompt", "")

    invocation_state = {
        "session_id": context.session_id,
        "user_id": payload.get("user_id"),
        "config": payload.get("config", {})
    }

    result = multi_agent_graph(user_input, invocation_state=invocation_state)
    return result.results["analyzer"].message['content'][0]['text']
```

### Agent별 Runtime 분리가 필요한 경우

다음 **예외적인 상황**에서만 분리를 고려:

1. **독립적인 서비스**: Agent가 완전히 다른 도메인/팀/서비스
2. **스케일링 요구사항**: 특정 Agent만 극도로 높은 트래픽
3. **격리 필요**: 보안/규정상 Agent 간 격리 필수
4. **기술 스택 차이**: Agent마다 Python 버전, 의존성이 완전히 다름

### 배포 명령어

```bash
# Graph 전체를 1개 Runtime으로 배포
agentcore configure -e multi_agent_app.py
agentcore deploy

# 호출 (전체 Graph 실행)
agentcore invoke '{"prompt": "Analyze candidate profile", "user_id": "123"}'
```
