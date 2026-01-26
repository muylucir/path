export const INPUT_TYPES = [
  "Event-Driven (이벤트 발생 시)",
  "Scheduled (정해진 시간)",
  "On-Demand (사용자 요청)",
  "Streaming (실시간 스트림)",
  "Conditional (조건 충족 시)",
] as const;

export const PROCESS_STEPS = [
  { label: "검색, API 조회, 문서 읽기 (정보 수집)", example: "예: 고객 DB에서 주문 내역 조회, 날씨 API 호출, PDF 문서에서 계약 조건 추출" },
  { label: "요약, 분류, 패턴 인식 (분석/이해)", example: "예: 긴 이메일을 3줄로 요약, 문의를 '환불/배송/기타'로 분류, 매출 데이터에서 이상 패턴 탐지" },
  { label: "의사결정, 평가, 우선순위 (추론/판단)", example: "예: 환불 승인 여부 결정, 이력서 적합도 점수 산정, 긴급 티켓 우선순위 배정" },
  { label: "문서, 코드, 응답 작성 (생성/작성)", example: "예: 고객 응대 이메일 작성, Python 코드 생성, 주간 보고서 초안 작성" },
  { label: "품질 확인, 자기 수정 (검증/반복)", example: "예: 생성된 코드 실행 후 오류 수정, 답변의 정확성 재검토, 여러 버전 비교 후 최선안 선택" },
] as const;

export const OUTPUT_TYPES = [
  { label: "답변, 요약, 설명 (텍스트 응답)", example: "예: 챗봇 답변, 문서 요약문, 개념 설명" },
  { label: "이메일, 리포트, 코드 (문서/보고서)", example: "예: 고객 회신 이메일, 주간 분석 리포트, API 연동 코드" },
  { label: "JSON, 분류 결과, 점수 (구조화된 데이터)", example: "예: {\"category\": \"환불\", \"priority\": \"high\"}, 적합도 85점" },
  { label: "DB 업데이트, 티켓 생성, 알림 (외부 시스템 변경)", example: "예: 주문 상태를 '처리완료'로 변경, Jira 티켓 생성, Slack 알림 발송" },
] as const;

export const HUMAN_LOOP_OPTIONS = [
  "완전 자동 (None)",
  "실행 전 승인 필요 (Review)",
  "불확실할 때만 개입 (Exception)",
  "AI와 함께 작업 (Collaborate)",
] as const;

export const ERROR_TOLERANCE_OPTIONS = [
  "틀려도 괜찮음 (낮은 리스크)",
  "사람이 검토 후 실행",
  "높은 정확도 필요 (90%+)",
  "매우 높은 정확도 필요 (99%+)",
] as const;

// P.A.T.H 4단계 - 기본 정보(P) → 준비도 점검(T) → 패턴 분석(A) → 명세서(H)
export const STEPS = ["기본 정보", "준비도 점검", "패턴 분석", "명세서"] as const;

// 준비도 레벨 시스템 (점수 → 아이콘 기반 단계)
export const READINESS_LEVELS = {
  READY: { icon: "✅", label: "준비됨", min: 8, color: "green", description: "바로 진행 가능" },
  GOOD: { icon: "🔵", label: "양호", min: 6, color: "blue", description: "약간의 보완으로 충분" },
  NEEDS_WORK: { icon: "🟡", label: "보완 필요", min: 4, color: "yellow", description: "추가 준비 권장" },
  PREPARE: { icon: "🟠", label: "준비 필요", min: 0, color: "orange", description: "상당한 준비 필요" },
} as const;

// Feasibility 항목 이름 매핑 (하위 호환성 유지)
export const FEASIBILITY_ITEM_NAMES = {
  data_access: "데이터 접근성",
  decision_clarity: "판단 명확성",
  error_tolerance: "오류 허용도",
  latency: "지연 요구사항",
  integration: "통합 복잡도",
} as const;

// 준비도 항목별 상세 정보 (툴팁용)
export const READINESS_ITEM_DETAILS = {
  data_access: {
    name: "데이터 접근성",
    description: "에이전트가 필요한 데이터에 접근할 수 있는 정도",
    criteria: "API 존재 여부, 인증 방식, 데이터 형식",
  },
  decision_clarity: {
    name: "판단 명확성",
    description: "에이전트가 내려야 할 판단의 명확성",
    criteria: "규칙화 가능 여부, 예시 데이터 존재, 전문가 지식 문서화",
  },
  error_tolerance: {
    name: "오류 허용도",
    description: "에이전트 실수의 허용 가능 범위",
    criteria: "검토 프로세스, 롤백 가능 여부, 리스크 수준",
  },
  latency: {
    name: "지연 요구사항",
    description: "응답 시간에 대한 요구사항",
    criteria: "실시간 필요 여부, 배치 처리 가능 여부, SLA",
  },
  integration: {
    name: "통합 복잡도",
    description: "외부 시스템과의 연동 복잡성",
    criteria: "연동 시스템 수, API 표준화, 인증 복잡도",
  },
} as const;

// Feasibility 판정 기준 (하위 호환성 유지)
export const FEASIBILITY_JUDGMENT = {
  PROCEED: { min: 40, label: "즉시 진행", emoji: "✅" },
  CONDITIONAL: { min: 30, label: "조건부 진행", emoji: "⚠️" },
  REEVALUATE: { min: 20, label: "재평가 필요", emoji: "🔄" },
  ALTERNATIVE: { min: 0, label: "대안 모색", emoji: "❌" },
} as const;
