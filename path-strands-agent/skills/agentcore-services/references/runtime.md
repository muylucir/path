# AgentCore Runtime

## 개념
- **서버리스 Agent 호스팅**: 인프라 관리 없이 Agent 배포
- **자동 스케일링**: 트래픽에 따라 자동 확장
- **세션 관리**: 세션 ID 기반 격리
- **보안 환경**: IAM 기반 권한 관리

## 사용 방법
```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent

# Runtime 앱 초기화
app = BedrockAgentCoreApp()

# Strands Agent 생성
agent = Agent(
    model="us.anthropic.claude-3-7-sonnet-20250219-v1:0",
    system_prompt="You're a helpful assistant."
)

# Entrypoint 정의
@app.entrypoint
def invoke(payload, context):
    """
    payload: 사용자 입력 {"prompt": "..."}
    context: Runtime 컨텍스트 (session_id 등)
    """
    response = agent(payload.get("prompt", "Hello"))
    return response.message['content'][0]['text']

if __name__ == "__main__":
    app.run()  # 로컬 테스트
```

## 배포
```bash
# Agent 설정
agentcore configure -e agent.py

# 배포
agentcore deploy

# 호출
agentcore invoke '{"prompt": "Hello"}'
agentcore invoke '{"prompt": "Hello"}' --session-id "session-123"
```

## 제약사항
- Python 3.11 이상 필요
- 컨테이너 이미지 크기 제한: 10GB
- 실행 타임아웃: 최대 15분
- 동시 실행 제한: 계정당 1000개
