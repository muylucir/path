# AgentCore Browser

## 개념
- **관리형 Chrome 브라우저**: 웹 페이지 자동화
- **보안 환경**: 격리된 브라우저 인스턴스
- **웹 스크래핑**: 콘텐츠 추출 및 상호작용

## 사용 방법
```python
from bedrock_agentcore.browser import BrowserTool

# Browser 도구 생성
browser_tool = BrowserTool(
    region_name="us-west-2",
    timeout=30  # 30초 타임아웃
)

# Agent에 추가
agent = Agent(
    model="...",
    tools=[browser_tool]
)

# 사용 예시
response = agent("Go to https://example.com and extract the main heading")
```

## 지원 기능
- 페이지 탐색 (navigate)
- 요소 클릭 (click)
- 텍스트 입력 (type)
- 스크린샷 (screenshot)
- 콘텐츠 추출 (extract)

## 제약사항
- 세션당 최대 10분
- JavaScript 실행 지원
- 파일 다운로드 제한: 100MB
- 동시 브라우저 세션: 계정당 10개
