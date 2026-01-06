# AWS 서비스 통합 패턴 가이드

Agent에서 AWS 서비스를 호출할 때 **직접 호출 (boto3)** vs **Lambda + AgentCore Gateway** 중 어떤 방식을 선택해야 하는지 결정하는 가이드입니다.

## 의사결정 플로우차트

```
AWS 서비스 호출 필요
    │
    ├─ 동기(Sync) 작업인가?
    │   ├─ Yes → Agent에서 직접 호출 고려
    │   └─ No (비동기) → Lambda + Gateway 권장
    │
    ├─ 여러 Agent에서 재사용하는가?
    │   ├─ Yes → Lambda + Gateway (중앙 집중화)
    │   └─ No → 직접 호출 가능
    │
    ├─ 복잡한 전/후처리 로직이 있는가?
    │   ├─ Yes → Lambda (로직 캡슐화)
    │   └─ No → 직접 호출 가능
    │
    └─ 인증/권한이 복잡한가?
        ├─ Yes → Gateway Identity 활용
        └─ No → Agent IAM Role로 충분
```

## 4가지 통합 패턴

### 패턴 A: Agent 직접 호출 (boto3)

**사용 시점:**
- 단순 동기 작업
- 단일 Agent 전용 도구
- 빠른 응답 필요 (Gateway 홉 없음)

**장점:**
- 구현 간단
- 레이턴시 최소
- 디버깅 용이

**단점:**
- Agent 코드 복잡도 증가
- 재사용 어려움
- Agent별 중복 구현 가능성

**예시:** S3 파일 읽기/쓰기, DynamoDB 간단 조회, Comprehend 단일 분석

---

### 패턴 B: Lambda + AgentCore Gateway

**사용 시점:**
- 비동기 작업 (폴링 필요)
- 복잡한 전/후처리 로직
- 여러 Agent에서 재사용
- 복잡한 인증/권한 관리

**장점:**
- 로직 캡슐화 (관심사 분리)
- 중앙 집중 관리
- Gateway Identity로 인증 통합
- 도구 재사용성 극대화

**단점:**
- 추가 인프라 관리
- Gateway 홉으로 레이턴시 증가
- 초기 설정 복잡

**예시:** Transcribe STT, 복잡한 RAG 검색, 배치 분석, 트랜잭션 처리

---

### 패턴 C: Self-hosted MCP (AgentCore Runtime 호스팅)

**사용 시점:**
- MCP 서버를 직접 구현하여 재사용하고 싶을 때
- Lambda 함수 대신 장기 실행 서비스가 필요할 때
- 기존 MCP 서버를 AgentCore 환경에서 사용하고 싶을 때

**구성:**
1. MCP 서버를 AgentCore Runtime에 배포 (FastAPI, Express 등)
2. AgentCore Gateway에 MCP 서버 등록
3. Agent에서 Gateway를 통해 MCP 도구 호출

**장점:**
- Lambda 콜드 스타트 없음
- 장기 실행 작업 가능
- MCP 프로토콜 그대로 사용

**단점:**
- 별도 Runtime 관리 필요
- Lambda보다 복잡한 설정

**예시:** 복잡한 파일 처리, 실시간 스트리밍, 상태 유지 작업

---

### 패턴 D: 하이브리드

**사용 시점:**
- 일부 작업은 간단 (직접), 일부는 복잡 (Gateway)
- 점진적 마이그레이션

**예시:**
- S3 파일 읽기 (직접) + Transcribe STT (Gateway)
- DynamoDB 조회 (직접) + 복잡한 집계 (Gateway)

---

## AWS 서비스 카테고리별 가이드

### 1. RAG/검색 시스템

| 옵션 | 특성 | 권장 패턴 | 이유 |
|------|------|----------|------|
| **Bedrock KB** | 관리형 RAG, 동기 API | 직접 호출 | Strands 내장 지원, 설정 간단 |
| **OpenSearch** | 자체 관리, 유연함 | Lambda + Gateway | 임베딩 생성 + kNN 검색 로직 |
| **Pinecone** | 외부 벡터DB | Lambda + Gateway | 외부 API 인증, 결과 정제 |
| **Kendra** | 엔터프라이즈 검색 | Lambda + Gateway | 복잡한 필터링, 권한 연동 |

**RAG 선택 플로우:**
```
RAG 필요
├─ AWS 관리형 원하는가?
│   ├─ Yes → Bedrock Knowledge Base (직접 호출)
│   └─ No → 아래 진행
├─ 기존 벡터DB 있는가?
│   ├─ OpenSearch → Lambda + Gateway (임베딩+검색 로직)
│   ├─ Pinecone → Lambda + Gateway (외부 API)
│   └─ 없음 → Bedrock KB 권장
└─ 커스텀 검색 로직 필요?
    ├─ Yes → Lambda로 캡슐화
    └─ No → 직접 호출 가능
```

---

### 2. AI/ML 서비스

| 서비스 | 작업 특성 | 권장 패턴 | 이유 |
|--------|----------|----------|------|
| **Transcribe** | 비동기, 폴링 필요 | Lambda + Gateway | 작업 시작 → 폴링 → 결과 수집 |
| **Comprehend** (단일) | 동기 | 직접 호출 | 단일 텍스트 분석은 간단 |
| **Comprehend** (배치) | 비동기 | Lambda + Gateway | 대량 처리, 결과 집계 |
| **Textract** (단순) | 동기 | 직접 호출 | 간단한 텍스트 추출 |
| **Textract** (복잡) | 비동기 | Lambda + Gateway | 테이블/폼 추출, 후처리 |
| **Rekognition** | 동기 | 직접 호출 | 대부분 동기 API |
| **Bedrock (LLM)** | 동기/스트리밍 | 직접 호출 | Strands Agent 핵심 기능 |
| **Polly** | 동기 | 상황별 | 결과를 S3 저장 시 Lambda |

---

### 3. 스토리지/데이터베이스

| 서비스 | 작업 특성 | 권장 패턴 | 이유 |
|--------|----------|----------|------|
| **S3** (Get/Put) | 동기, 단순 | 직접 호출 | 간단한 파일 작업 |
| **S3** (대용량) | 멀티파트 필요 | Lambda + Gateway | 청크 처리, 재시도 로직 |
| **S3** (Presigned URL) | URL 생성 | 직접 호출 | 간단한 URL 생성 |
| **DynamoDB** (CRUD) | 동기, 단순 | 직접 호출 | 간단한 조회/저장 |
| **DynamoDB** (트랜잭션) | 복잡 | Lambda + Gateway | 비즈니스 로직 캡슐화 |
| **DynamoDB** (집계) | 복잡 | Lambda + Gateway | Scan + 집계 로직 |
| **RDS/Aurora** | 연결 관리 | Lambda + Gateway | 커넥션 풀링, RDS Proxy |

---

### 4. 메시징/알림

| 서비스 | 작업 특성 | 권장 패턴 | 이유 |
|--------|----------|----------|------|
| **SES** (단순) | 텍스트 이메일 | 직접 호출 | 간단한 발송 |
| **SES** (복잡) | 템플릿, 첨부 | Lambda + Gateway | HTML 렌더링, 첨부 처리 |
| **SNS** | 알림 발행 | 직접 호출 | 간단한 publish |
| **SQS** | 메시지 큐 | Lambda + Gateway | 배치 처리, 재시도 로직 |
| **EventBridge** | 이벤트 라우팅 | Lambda + Gateway | 이벤트 패턴 구성 |

---

### 5. 오케스트레이션

| 서비스 | 작업 특성 | 권장 패턴 | 이유 |
|--------|----------|----------|------|
| **Step Functions** | 워크플로우 실행 | Lambda + Gateway | 상태 머신 관리 |
| **Lambda** (직접 호출) | 함수 실행 | Gateway 권장 | 중앙 집중 도구 관리 |

---

## 구현 예시

### RAG 예시

**Bedrock Knowledge Base (직접 호출)**

```python
from strands import tool
import boto3

@tool
def search_knowledge_base(query: str, kb_id: str) -> list[str]:
    """Bedrock Knowledge Base에서 관련 문서 검색"""
    bedrock_agent = boto3.client('bedrock-agent-runtime')
    response = bedrock_agent.retrieve(
        knowledgeBaseId=kb_id,
        retrievalQuery={'text': query},
        retrievalConfiguration={
            'vectorSearchConfiguration': {'numberOfResults': 5}
        }
    )
    return [r['content']['text'] for r in response['retrievalResults']]
```

**OpenSearch RAG (Lambda + Gateway)**

```python
# Lambda 함수 - 복잡한 검색 로직 캡슐화
import boto3
from opensearchpy import OpenSearch

bedrock = boto3.client('bedrock-runtime')
opensearch = OpenSearch(hosts=[{'host': 'opensearch-endpoint', 'port': 443}])

def lambda_handler(event, context):
    query = event['query']
    index_name = event.get('index', 'documents')
    top_k = event.get('top_k', 5)

    # 1. Bedrock Titan으로 임베딩 생성
    embedding_response = bedrock.invoke_model(
        modelId='amazon.titan-embed-text-v2:0',
        body=json.dumps({'inputText': query})
    )
    embedding = json.loads(embedding_response['body'].read())['embedding']

    # 2. OpenSearch kNN 검색
    results = opensearch.search(
        index=index_name,
        body={
            'size': top_k,
            'query': {
                'knn': {
                    'embedding': {
                        'vector': embedding,
                        'k': top_k
                    }
                }
            }
        }
    )

    # 3. 결과 정제
    documents = []
    for hit in results['hits']['hits']:
        documents.append({
            'content': hit['_source']['content'],
            'score': hit['_score'],
            'metadata': hit['_source'].get('metadata', {})
        })

    return {'documents': documents}
```

---

### AI/ML 서비스 예시

**Transcribe STT (Lambda + Gateway)**

```python
# Lambda 함수 - 비동기 작업 처리
import boto3
import time
import uuid

transcribe = boto3.client('transcribe')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    s3_uri = event['s3_uri']  # s3://bucket/audio.mp3
    output_bucket = event.get('output_bucket', 'transcripts-bucket')
    language_code = event.get('language_code', 'ko-KR')

    # 1. 비동기 작업 시작
    job_name = f"transcribe-{uuid.uuid4()}"
    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={'MediaFileUri': s3_uri},
        MediaFormat=s3_uri.split('.')[-1],  # mp3, wav 등
        LanguageCode=language_code,
        OutputBucketName=output_bucket
    )

    # 2. 완료 대기 (최대 10분)
    for _ in range(120):
        job = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        status = job['TranscriptionJob']['TranscriptionJobStatus']

        if status == 'COMPLETED':
            transcript_uri = job['TranscriptionJob']['Transcript']['TranscriptFileUri']
            # 결과 파일 읽기
            bucket, key = parse_s3_uri(transcript_uri)
            result = s3.get_object(Bucket=bucket, Key=key)
            transcript_data = json.loads(result['Body'].read())
            return {
                'status': 'completed',
                'transcript': transcript_data['results']['transcripts'][0]['transcript']
            }
        elif status == 'FAILED':
            return {
                'status': 'failed',
                'error': job['TranscriptionJob'].get('FailureReason', 'Unknown error')
            }

        time.sleep(5)

    return {'status': 'timeout', 'error': 'Transcription job timed out'}
```

**Comprehend 감정 분석 (직접 호출)**

```python
from strands import tool
import boto3

@tool
def analyze_sentiment(text: str, language: str = 'ko') -> dict:
    """텍스트의 감정 분석 (긍정/부정/중립/혼합)"""
    comprehend = boto3.client('comprehend')
    response = comprehend.detect_sentiment(
        Text=text,
        LanguageCode=language
    )
    return {
        'sentiment': response['Sentiment'],
        'confidence': response['SentimentScore']
    }
```

---

### 스토리지 예시

**S3 파일 읽기 (직접 호출)**

```python
from strands import tool
import boto3

@tool
def read_s3_file(bucket: str, key: str) -> str:
    """S3에서 텍스트 파일 읽기"""
    s3 = boto3.client('s3')
    response = s3.get_object(Bucket=bucket, Key=key)
    return response['Body'].read().decode('utf-8')

@tool
def write_s3_file(bucket: str, key: str, content: str) -> dict:
    """S3에 텍스트 파일 저장"""
    s3 = boto3.client('s3')
    s3.put_object(Bucket=bucket, Key=key, Body=content.encode('utf-8'))
    return {'bucket': bucket, 'key': key, 'status': 'uploaded'}
```

**DynamoDB 트랜잭션 (Lambda + Gateway)**

```python
# Lambda 함수 - 복잡한 비즈니스 로직
import boto3
from datetime import datetime

dynamodb = boto3.client('dynamodb')

def lambda_handler(event, context):
    order_id = event['order_id']
    user_id = event['user_id']
    items = event['items']  # [{product_id, quantity}, ...]

    # 트랜잭션 항목 구성
    transact_items = []

    # 1. 각 상품 재고 감소
    for item in items:
        transact_items.append({
            'Update': {
                'TableName': 'products',
                'Key': {'id': {'S': item['product_id']}},
                'UpdateExpression': 'SET stock = stock - :qty',
                'ConditionExpression': 'stock >= :qty',
                'ExpressionAttributeValues': {
                    ':qty': {'N': str(item['quantity'])}
                }
            }
        })

    # 2. 주문 생성
    transact_items.append({
        'Put': {
            'TableName': 'orders',
            'Item': {
                'id': {'S': order_id},
                'user_id': {'S': user_id},
                'items': {'S': json.dumps(items)},
                'status': {'S': 'pending'},
                'created_at': {'S': datetime.now().isoformat()}
            }
        }
    })

    try:
        dynamodb.transact_write_items(TransactItems=transact_items)
        return {'order_id': order_id, 'status': 'completed'}
    except dynamodb.exceptions.TransactionCanceledException as e:
        return {'order_id': order_id, 'status': 'failed', 'error': 'Insufficient stock'}
```

---

## 모범 사례 체크리스트

### 직접 호출 시
- [ ] 간단한 동기 작업인지 확인
- [ ] Agent IAM Role에 필요한 권한 부여
- [ ] 에러 처리 구현
- [ ] 타임아웃 설정 (Agent 전체 응답 시간 고려)

### Lambda + Gateway 시
- [ ] 비동기 작업 완료 대기 로직 구현
- [ ] Lambda 타임아웃 설정 (최대 15분)
- [ ] Gateway Target으로 등록
- [ ] 입력/출력 스키마 정의
- [ ] 에러 처리 Lambda 내부에서 처리
- [ ] CloudWatch 로깅 활성화

### 공통
- [ ] 재시도 로직 구현 (필요시)
- [ ] 민감 정보 하드코딩 금지 (Secrets Manager 사용)
- [ ] 비용 최적화 고려 (호출 빈도, 데이터 크기)

---

## 비교 요약

| 기준 | 직접 호출 | Lambda + Gateway |
|------|----------|------------------|
| **구현 복잡도** | 낮음 | 중간 |
| **레이턴시** | 최소 | Gateway 홉 추가 |
| **재사용성** | 낮음 | 높음 |
| **유지보수** | Agent별 | 중앙 집중 |
| **적합한 작업** | 동기, 단순 | 비동기, 복잡 |
| **인증 관리** | Agent IAM | Gateway Identity |
