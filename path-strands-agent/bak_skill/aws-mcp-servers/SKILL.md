---
name: aws-mcp-servers
description: AWS 공식 MCP 서버 목록 및 AgentCore 통합 가이드
license: Apache-2.0
metadata:
  version: "1.0.0"
  author: path-team
---

# AWS MCP Servers

AWS에서 공식 제공하는 MCP 서버 목록과 Amazon Bedrock AgentCore 배포 시 권장 통합 방식.

## Quick Decision: MCP vs 직접 호출

AgentCore Runtime에 배포할 때, 각 AWS 서비스를 어떻게 통합할지 결정하는 가이드:

| AWS 서비스 | 공식 MCP | AgentCore 권장 | tools 파라미터 | 이유 |
|-----------|---------|---------------|---------------|------|
| S3 | O | **boto3 직접** | tools=[] | 동기, 단순, 오버헤드 제거 |
| DynamoDB | O | **boto3 직접** | tools=[] | 동기, 단순 |
| Bedrock KB | O | **boto3 직접** | tools=[] | 동기, 단순 |
| Transcribe | X | **Lambda MCP** | tools=[mcp_transcribe] | 비동기, 폴링 필요 |
| Polly | X | **Lambda MCP** | tools=[mcp_polly] | 비동기 |
| Textract | X | **Lambda MCP** | tools=[mcp_textract] | 비동기, 폴링 필요 |
| Rekognition | X | **Lambda MCP** | tools=[mcp_rekognition] | 비동기 |
| Comprehend | X | **Lambda MCP** | tools=[mcp_comprehend] | 비동기 |
| CloudWatch | O | 상황에 따라 | - | 모니터링 용도 |
| SES | X | **Lambda MCP** | tools=[mcp_ses] | 이메일 전송 |

**핵심 원칙:**
- **동기 + 단순**: boto3 직접 호출 (S3, DynamoDB, Bedrock KB)
- **비동기 + 폴링**: Lambda MCP로 래핑 (Transcribe, Textract)
- **외부 인증**: Self-hosted MCP (Slack, GitHub)

## 외부 서비스 (Non-AWS)

| 서비스 | 통합 방식 | tools 파라미터 |
|--------|----------|---------------|
| Slack | Self-hosted MCP | tools=[mcp_slack] |
| GitHub | Self-hosted MCP | tools=[mcp_github] |
| Gmail | Self-hosted MCP | tools=[mcp_gmail] |
| Custom REST API | OpenAPI Gateway | tools=[mcp_custom_api] |

## Agent Components 테이블 작성 규칙

### Tools 컬럼 표기법

| 통합 방식 | Tools 컬럼 표기 | 예시 |
|----------|----------------|------|
| boto3 직접 호출 | `boto3 {서비스명}` | boto3 S3, boto3 DynamoDB, boto3 Bedrock KB |
| Lambda MCP | `Lambda MCP ({서비스명})` | Lambda MCP (Transcribe), Lambda MCP (Textract) |
| Self-hosted MCP | `Self-hosted MCP ({서비스명})` | Self-hosted MCP (Slack) |
| 도구 없음 | `없음` | 없음 |

### 올바른 예시

| Agent Name | Tools |
|------------|-------|
| transcription_agent | boto3 S3, Lambda MCP (Transcribe) |
| legal_research_agent | boto3 Bedrock KB |
| drafting_agent | boto3 DynamoDB |
| notifier_agent | Self-hosted MCP (Slack) |

### 잘못된 예시 (사용 금지)

| 잘못된 표기 | 올바른 표기 |
|------------|------------|
| MCP S3 | boto3 S3 |
| RAG MCP | boto3 Bedrock KB |
| S3 MCP | boto3 S3 |
| Bedrock MCP | boto3 Bedrock KB |

## Graph 구조 코드 작성 규칙

**boto3 직접 호출 서비스는 tools 파라미터에 포함하지 않습니다:**

```python
# 올바른 예시
transcription_agent = Agent(
    name="transcription_agent",
    system_prompt="...",
    tools=[mcp_transcribe]  # S3는 boto3 직접 호출이므로 제외, Transcribe만 포함
)

legal_research_agent = Agent(
    name="legal_research_agent",
    system_prompt="...",
    tools=[]  # Bedrock KB는 boto3 직접 호출이므로 빈 배열
)

notifier_agent = Agent(
    name="notifier_agent",
    system_prompt="...",
    tools=[mcp_slack]  # 외부 서비스는 MCP 필요
)
```

```python
# 잘못된 예시 (사용 금지)
legal_research_agent = Agent(
    name="legal_research_agent",
    tools=[mcp_s3, mcp_bedrock_kb]  # 잘못됨! boto3 직접 호출 서비스
)
```

## AWS 공식 MCP 전체 목록 (참조용)

> 출처: https://awslabs.github.io/mcp/

### AI & ML
- Amazon Bedrock Knowledge Bases Retrieval
- Amazon Nova Canvas (이미지 생성)
- Amazon SageMaker AI

### Data & Analytics
- Amazon DynamoDB
- Amazon Aurora PostgreSQL/MySQL
- Amazon ElastiCache
- AWS S3 Tables

### Infrastructure
- AWS CloudFormation
- AWS CDK
- Amazon EKS/ECS
- AWS Serverless (SAM)
- AWS Cloud Control API

### Operations
- Amazon CloudWatch
- AWS Cost Explorer
- AWS IAM
- AWS Diagram

### Documentation
- AWS Documentation
- AWS Knowledge

## 핵심 기억사항

1. **공식 MCP가 있어도 AgentCore에서는 boto3 직접 호출이 더 효율적인 경우가 많음**
2. **Quick Decision 테이블의 "AgentCore 권장" 컬럼을 따르세요**
3. **Tools 컬럼 표기와 tools 파라미터가 일치해야 함**
4. **boto3 직접 호출 서비스는 절대 tools 파라미터에 포함하지 마세요**
