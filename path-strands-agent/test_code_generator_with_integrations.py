"""
CodeGeneratorAgent 통합 테스트 (Integration Details 포함)
"""

from code_generator_agent import code_generator_agent

# PATH 명세서 예시
test_spec = """
# Gmail 자동 응답 Agent 명세서

## Agent Components

| Agent 이름 | 역할 | Input | Output | LLM | Tools |
|-----------|------|-------|--------|-----|-------|
| analyzer_agent | 이메일 분석 | 이메일 내용 | 분석 결과 | Claude Sonnet 4.5 | search_kb |
| responder_agent | 답장 생성 | 분석 결과 | 답장 메시지 | Claude Sonnet 4.5 | send_email |

## Graph 구조

```python
builder = GraphBuilder()
builder.add_node(analyzer_agent, "analyzer")
builder.add_node(responder_agent, "responder")
builder.add_edge("analyzer", "responder")
builder.set_entry_point("analyzer")
graph = builder.build()
```

## AgentCore 구성

| 구성 요소 | 설정 내용 |
|----------|----------|
| Runtime | 1개 (전체 Graph 호스팅) |
| Memory | Namespace 전략 (사용자별 격리) |
| Gateway | OpenAPI (Gmail), Bedrock KB |
| Identity | OAuth2 (Google) |
"""

# 통합 정보 예시 (Step 1에서 선택한 것)
integration_details = [
    {
        "id": "gmail-api-001",
        "type": "api",
        "name": "Gmail API",
        "description": "이메일 읽기/쓰기",
        "config": {
            "baseUrl": "https://gmail.googleapis.com",
            "authType": "oauth2",
            "authConfig": {
                "oauth2TokenUrl": "https://oauth2.googleapis.com/token",
                "oauth2ClientId": "YOUR_CLIENT_ID",
                "oauth2Scopes": [
                    "https://www.googleapis.com/auth/gmail.send",
                    "https://www.googleapis.com/auth/gmail.readonly"
                ]
            },
            "endpoints": [
                {
                    "path": "/gmail/v1/users/me/messages",
                    "method": "GET",
                    "summary": "메시지 목록 조회"
                },
                {
                    "path": "/gmail/v1/users/me/messages/send",
                    "method": "POST",
                    "summary": "메시지 전송"
                }
            ]
        }
    },
    {
        "id": "kb-001",
        "type": "rag",
        "name": "회사 정책 지식베이스",
        "description": "FAQ 및 정책 문서",
        "config": {
            "provider": "bedrock-kb",
            "bedrockKb": {
                "knowledgeBaseId": "YOUR_KB_ID",
                "region": "us-west-2"
            }
        }
    }
]

print("🚀 CodeGeneratorAgent 통합 테스트 시작")
print("=" * 60)

try:
    # 코드 생성 (통합 정보 포함)
    print("\n📝 PATH 명세서 + Integration Details → Strands Agent SDK 코드 변환 중...")
    files = code_generator_agent.generate(
        path_spec=test_spec,
        integration_details=integration_details
    )

    print(f"\n✅ 총 {len(files)}개 파일 생성 완료")
    print("=" * 60)

    for filename in files.keys():
        print(f"  - {filename}")

    # tools.py 내용 미리보기
    print("\n" + "=" * 60)
    print("📋 tools.py 미리보기 (통합 정보 반영 확인)")
    print("=" * 60)
    tools_content = files.get("tools.py", "")
    # 처음 50줄만 출력
    lines = tools_content.split("\n")[:50]
    print("\n".join(lines))

    if len(lines) < len(tools_content.split("\n")):
        print("\n... (중략) ...")

    print("\n" + "=" * 60)
    print("🎉 테스트 성공!")

except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()
