"""
CodeGeneratorAgent 테스트
"""

from code_generator_agent import code_generator_agent

# 간단한 PATH 명세서 예시
test_spec = """
# PATH 명세서

## Agent Components

| Agent 이름 | 역할 | Input | Output | LLM | Tools |
|-----------|------|-------|--------|-----|-------|
| hello_agent | 인사 메시지 생성 | 사용자 이름 | 인사 메시지 | Claude Sonnet 4.5 | 없음 |

## Graph 구조

```python
builder = GraphBuilder()
builder.add_node(hello_agent, "hello")
builder.set_entry_point("hello")
graph = builder.build()
```

## AgentCore 구성

| 구성 요소 | 설정 내용 |
|----------|----------|
| Runtime | 1개 (전체 Graph 호스팅) |
| Memory | 없음 |
| Gateway | 없음 |
| Identity | 없음 |
"""

print("🚀 CodeGeneratorAgent 테스트 시작")
print("=" * 60)

try:
    # 코드 생성
    print("\n📝 PATH 명세서를 Strands Agent SDK 코드로 변환 중...")
    files = code_generator_agent.generate(test_spec)

    print(f"\n✅ 총 {len(files)}개 파일 생성 완료")
    print("=" * 60)

    for filename in files.keys():
        print(f"  - {filename}")

    print("\n" + "=" * 60)
    print("🎉 테스트 성공!")

except Exception as e:
    print(f"\n❌ 오류 발생: {e}")
    import traceback
    traceback.print_exc()
