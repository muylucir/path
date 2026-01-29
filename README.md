# P.A.T.H Agent Designer

AI Agent 아이디어 검증 및 명세서 자동 생성 도구

## P.A.T.H란?

**P**roblem → **T**echnical → **A**gent Pattern → **H**andoff

| Step | 경로 | 설명 |
|------|------|------|
| 1 | `/` | Pain Point 입력 |
| 2 | `/feasibility` | 준비도 점검 (5개 항목) |
| 3 | `/analyze` | 패턴 분석 대화 |
| 4 | `/results` | 명세서 생성 |

## 실행

```bash
# Backend
cd path-strands-agent
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python api_server.py  # http://localhost:8001

# Frontend
cd path-web
npm install
npm run dev  # http://localhost:3009
```

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python 3.11+, FastAPI, Strands Agents SDK
- **LLM**: AWS Bedrock Claude Opus 4.5

## AWS 요구사항

```bash
# DynamoDB 테이블
aws dynamodb create-table \
  --table-name path-agent-sessions \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
  --region ap-northeast-2
```

권한: `bedrock:InvokeModel*`, `dynamodb:*`

## 참고

- [P.A.T.H 프레임워크 문서](PATH.md)
