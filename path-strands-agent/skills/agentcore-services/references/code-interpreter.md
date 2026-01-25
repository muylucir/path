# AgentCore Code Interpreter

## 개념

AgentCore Code Interpreter는 AI 에이전트가 코드를 실행하여 데이터를 분석하고 검증할 수 있게 하는 완전 관리형 서버리스 런타임입니다.

**핵심 가치:**
- **실행 기반 검증**: LLM이 생성한 코드를 실제 실행하여 결과 검증
- **격리된 보안 환경**: Firecracker MicroVM 기반 샌드박스
- **서버리스**: 인프라 관리 불필요, 자동 확장

**LLM의 한계 해결:**
- LLM은 통계적 예측만 수행하므로 실제 계산/검증 불가
- Code Interpreter를 통해 "예측"이 아닌 "검증된 결과" 제공
- 연구 결과: 코드 실행 피드백 활용 시 논리 일관성 46% → 87% 향상

## System vs Custom Code Interpreter

| 구분 | System Code Interpreter | Custom Code Interpreter |
|------|------------------------|------------------------|
| **용도** | 빠른 서버리스 실험 | 엔터프라이즈 맞춤형 |
| **네트워크** | 기본 차단 | VPC 구성 가능 |
| **IAM** | 기본 역할 | 커스텀 IAM 역할 |
| **관리** | 완전 관리형 | 사용자가 리소스 소유 |
| **사용 사례** | 데이터 분석, EDA | CI/CD, 규제 준수 환경 |

**System**: 신속하고 안전한 서버리스 실험 환경
**Custom**: 조직 수준의 제어와 통제가 가능한 확장형 아키텍처

## 동작 과정

### 1. 요청 처리
사용자의 자연어 명령을 분석하여 코드 실행 필요 여부 판단:
```
"CSV 파일에서 2023년 매출 합계를 계산해줘"
→ 모델이 "execute_python 호출 필요" 판단
→ AgentCore Gateway를 통해 SigV4 서명으로 인증
→ Firecracker 기반 독립 세션 생성
```

### 2. 격리 환경에서 실행
- **Firecracker MicroVM**: AWS Lambda와 동일한 격리 계층
- **리소스 독립**: CPU, 메모리, 스토리지가 세션 단위로 배정
- **보안**: 네트워크 기본 차단, NIST SP 800-53 Rev. 5 준수
- **세션 종료 시**: 모든 파일, 메모리 페이지, 임시 디스크 삭제

### 3. 결과 반환 및 검증
- 실행 결과는 JSON 형태로 직렬화되어 모델 컨텍스트로 반환
- CloudTrail 이벤트로 모든 실행 로깅
- 추가 추론 수행 또는 시각화 가능

## 사용 패턴

### 패턴 1: SDK Client 사용 (권장)

AgentCore SDK를 사용하여 Code Interpreter를 호출합니다.

```python
from bedrock_agentcore.tools.code_interpreter_client import CodeInterpreter
import json

# 1. 클라이언트 초기화
client = CodeInterpreter("us-west-2")

# 2. 샌드박스 세션 시작
client.start()

# 3. 코드 실행
response = client.invoke(
    "executeCode",
    {
        "language": "python",
        "code": 'print("Hello World!!!")',
        "clearContext": False,
    },
)

print(json.dumps(response, indent=2))

# 4. 세션 종료
client.stop()
```

**사용 사례:**
- 데이터 분석 자동화 스크립트
- 서버리스 기반 데이터 품질 검증
- 파일 조작 및 EDA

### 패턴 2: boto3 직접 사용

boto3를 사용하여 Code Interpreter API를 직접 호출할 수 있습니다.

```python
import boto3
import json

# 클라이언트 생성
client = boto3.client('bedrock-agentcore', region_name='us-west-2')

# 1. 세션 생성
session_response = client.create_code_interpreter_session()
session_id = session_response['sessionId']

# 2. 코드 실행
execute_response = client.execute_code(
    sessionId=session_id,
    code='''
import pandas as pd
import numpy as np

# 샘플 데이터 생성
data = {'name': ['Alice', 'Bob', 'Charlie'], 'age': [25, 30, 35]}
df = pd.DataFrame(data)
print(df.describe())
''',
    language='python'
)

# 3. 결과 확인
for event in execute_response['stream']:
    if 'result' in event:
        print(event['result'])

# 4. 세션 종료
client.delete_code_interpreter_session(sessionId=session_id)
```

### 패턴 3: Context Manager 사용

`code_session` context manager로 세션 수명주기를 자동 관리합니다.

```python
from bedrock_agentcore.tools.code_interpreter_client import code_session

with code_session("us-west-2") as client:
    # 파일 업로드
    client.upload_file("data.csv", csv_content)

    # 데이터 분석 코드 실행
    response = client.invoke(
        "executeCode",
        {
            "language": "python",
            "code": '''
import pandas as pd
df = pd.read_csv("data.csv")
print(df.head())
print(df.describe())
''',
            "clearContext": False,
        },
    )

    # 결과 확인
    for event in response["stream"]:
        if "result" in event:
            print(event["result"])

# 세션 자동 종료

## Strands Agent 통합

에이전트의 "도구(tool)"로 통합하여 모델이 필요 시 자동 호출:

```python
from bedrock_agentcore.tools.code_interpreter_client import code_session
from strands import Agent, tool
import json

SYSTEM_PROMPT = """
You are an assistant that validates important answers through code execution.
"""

@tool
def execute_python(code: str, description: str = "") -> str:
    """Execute Python code in a secure sandbox environment."""
    if description:
        code = f"# {description}\n{code}"

    with code_session("us-west-2") as code_client:
        response = code_client.invoke(
            "executeCode",
            {
                "code": code,
                "language": "python",
                "clearContext": False,
            },
        )

    for event in response["stream"]:
        return json.dumps(event["result"])

agent = Agent(
    tools=[execute_python],
    system_prompt=SYSTEM_PROMPT,
)

# 사용 예시
result = agent("지난 5년간 윤년의 수를 계산해줘")
```

**동작 흐름:**
1. 모델이 사용자의 질문을 분석하여 "코드 실행 필요 여부" 판단
2. 모델이 자연어 명령을 바탕으로 Python 코드 생성
3. Code Interpreter 세션이 자동 생성되며 해당 코드 실행
4. 실행 결과가 다시 모델 컨텍스트로 주입되어 최종 답변 생성

**활용 영역:**
- 데이터 검증 에이전트
- 로그 분석 자동화
- 파일 기반 리포트 생성 에이전트
- 수치 계산 기반 재무·보안 분석

## 제약사항

| 항목 | 제한 |
|------|------|
| **세션 유지** | 기본 15분, 최대 8시간 |
| **메모리** | 2GB |
| **파일 크기** | 100MB (S3 통합 시 5GB) |
| **네트워크** | 기본 차단 (Custom은 VPC 가능) |
| **지원 언어** | Python, JavaScript, TypeScript |
| **모니터링** | CloudTrail, CloudWatch 통합 |
