# PATH Strands Agent

Strands Agent 기반 PATH 2단계(대화형 분석) 및 3단계(명세서 생성) 구현

## 환경

- Python 3.11
- Strands Agent 1.20.0
- AWS Bedrock (Claude Sonnet 4.5)

## 설치

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 테스트

```bash
python hello_agent.py
```

## 구조

```
path-strands-agent/
├── venv/                    # Python 가상환경
├── requirements.txt         # 의존성
├── hello_agent.py          # Hello World Agent (테스트용)
└── README.md               # 이 파일
```

## 다음 단계

- Task 2: Chat Agent 구현 (2단계 대화형 분석)
- Task 3: SKILL 설정 (AgentCore/Strands 문서 연동)
- Task 4: Spec Agent 구현 (3단계 명세서 생성)
