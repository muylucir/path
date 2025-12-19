export const INPUT_TYPES = [
  "Event-Driven (이벤트 발생 시)",
  "Scheduled (정해진 시간)",
  "On-Demand (사용자 요청)",
  "Streaming (실시간 스트림)",
  "Conditional (조건 충족 시)",
] as const;

export const DATA_SOURCE_TYPES = [
  "MCP Server",
  "API",
  "Database",
  "File (S3/Local)",
  "Web Scraping",
] as const;

export const PROCESS_STEPS = [
  "데이터 수집 (여러 소스에서 정보 조회)",
  "분석/분류 (패턴 인식, 카테고리 분류, 이상 탐지)",
  "판단/평가 (의사결정, 점수 산정, 우선순위 결정)",
  "콘텐츠 생성 (문서, 이메일, 코드, 보고서 작성)",
  "검증/개선 (품질 확인, 오류 수정, 반복 개선)",
  "실행/연동 (API 호출, DB 업데이트, 알림)",
] as const;

export const OUTPUT_TYPES = [
  "Decision (의사결정: 승인/거절, 분류, 점수)",
  "Content (콘텐츠: 문서, 이메일, 보고서)",
  "Notification (알림: Slack, 이메일, SMS)",
  "Action (액션: 티켓 생성, API 호출, DB 업데이트)",
  "Insight (인사이트: 분석, 추천, 예측)",
] as const;

export const HUMAN_LOOP_OPTIONS = [
  "None (완전 자동)",
  "Review (실행 전 승인 필요)",
  "Exception (불확실할 때만)",
  "Collaborate (AI와 함께 작업)",
] as const;

export const ERROR_TOLERANCE_OPTIONS = [
  "틀려도 괜찮음 (낮은 리스크)",
  "사람이 검토 후 실행",
  "높은 정확도 필요 (90%+)",
  "매우 높은 정확도 필요 (99%+)",
] as const;
