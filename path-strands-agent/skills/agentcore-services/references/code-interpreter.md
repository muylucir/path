# AgentCore Code Interpreter

## 개념
- **안전한 코드 실행**: 격리된 샌드박스 환경
- **Python 코드 실행**: 데이터 분석, 계산 등
- **파일 처리**: CSV, JSON 등 파일 읽기/쓰기

## 사용 방법
```python
from bedrock_agentcore.code_interpreter import CodeInterpreterTool

# Code Interpreter 도구 생성
code_tool = CodeInterpreterTool(
    region_name="us-west-2"
)

# Agent에 추가
agent = Agent(
    model="...",
    tools=[code_tool]
)

# 사용 예시
response = agent("Calculate the mean of [1, 2, 3, 4, 5] using Python")
```

## 제약사항
- Python 3.10 환경
- 실행 타임아웃: 최대 5분
- 메모리 제한: 2GB
- 파일 크기 제한: 100MB
- 네트워크 접근 불가
