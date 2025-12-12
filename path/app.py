import streamlit as st
import boto3
import json
from datetime import datetime
import uuid
from decimal import Decimal

st.set_page_config(page_title="P.A.T.H Agent Designer", page_icon="🤖", layout="wide")

# Decimal을 float로 변환하는 헬퍼 함수
def decimal_to_float(obj):
    """DynamoDB Decimal 타입을 JSON 직렬화 가능하게 변환"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj

# Bedrock 클라이언트
@st.cache_resource
def get_bedrock_client():
    return boto3.client('bedrock-runtime', region_name='us-east-1')

# DynamoDB 클라이언트
@st.cache_resource
def get_dynamodb_client():
    return boto3.resource('dynamodb', region_name='us-east-1')

def save_to_dynamodb(session_data):
    """DynamoDB에 세션 저장"""
    try:
        dynamodb = get_dynamodb_client()
        table = dynamodb.Table('path-agent-sessions')
        
        session_id = str(uuid.uuid4())
        timestamp = datetime.now().isoformat()
        
        item = {
            'session_id': session_id,
            'timestamp': timestamp,
            'pain_point': session_data.get('pain_point', ''),
            'input_type': session_data.get('input_type', ''),
            'process_steps': session_data.get('process_steps', []),
            'output_type': session_data.get('output_type', ''),
            'human_loop': session_data.get('human_loop', ''),
            'data_source': session_data.get('data_source', ''),
            'error_tolerance': session_data.get('error_tolerance', ''),
            'additional_context': session_data.get('additional_context', ''),
            'pattern': session_data.get('pattern', ''),
            'pattern_reason': session_data.get('pattern_reason', ''),
            'feasibility_breakdown': json.dumps(session_data.get('feasibility_breakdown', {}), ensure_ascii=False),
            'feasibility_score': session_data.get('feasibility_score', 0),
            'recommendation': session_data.get('recommendation', ''),
            'risks': json.dumps(session_data.get('risks', []), ensure_ascii=False),
            'next_steps': json.dumps(session_data.get('next_steps', []), ensure_ascii=False),
            'chat_history': json.dumps(session_data.get('chat_history', []), ensure_ascii=False),
            'specification': session_data.get('specification', '')
        }
        
        table.put_item(Item=item)
        return session_id
    except Exception as e:
        st.error(f"저장 실패: {str(e)}")
        return None

def load_from_dynamodb(session_id):
    """DynamoDB에서 세션 로드"""
    try:
        dynamodb = get_dynamodb_client()
        table = dynamodb.Table('path-agent-sessions')
        
        response = table.get_item(Key={'session_id': session_id})
        
        if 'Item' in response:
            item = response['Item']
            # JSON 문자열을 파싱
            item['chat_history'] = json.loads(item.get('chat_history', '[]'))
            item['feasibility_breakdown'] = json.loads(item.get('feasibility_breakdown', '{}'))
            item['risks'] = json.loads(item.get('risks', '[]'))
            item['next_steps'] = json.loads(item.get('next_steps', '[]'))
            return item
        return None
    except Exception as e:
        st.error(f"로드 실패: {str(e)}")
        return None

def delete_from_dynamodb(session_id):
    """DynamoDB에서 세션 삭제"""
    try:
        dynamodb = get_dynamodb_client()
        table = dynamodb.Table('path-agent-sessions')
        
        table.delete_item(Key={'session_id': session_id})
        return True
    except Exception as e:
        st.error(f"삭제 실패: {str(e)}")
        return False

def list_recent_sessions(limit=10):
    """최근 세션 목록 조회"""
    try:
        dynamodb = get_dynamodb_client()
        table = dynamodb.Table('path-agent-sessions')
        
        response = table.scan(
            Limit=limit,
            ProjectionExpression='session_id, #ts, pain_point, feasibility_score',
            ExpressionAttributeNames={'#ts': 'timestamp'}
        )
        
        items = response.get('Items', [])
        # 타임스탬프로 정렬
        items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return items
    except Exception as e:
        st.error(f"목록 조회 실패: {str(e)}")
        return []

def call_claude(prompt, system_prompt=None):
    """Claude Sonnet 4.5 호출"""
    bedrock = get_bedrock_client()
    
    messages = [{"role": "user", "content": prompt}]
    
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 16000,  # 명세서를 위해 증가
        "messages": messages,
        "temperature": 0.5
    }
    
    if system_prompt:
        body["system"] = system_prompt
    
    response = bedrock.invoke_model(
        modelId="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        body=json.dumps(body)
    )
    
    result = json.loads(response['body'].read())
    return result['content'][0]['text']

def call_claude_stream(prompt, system_prompt=None):
    """Claude Sonnet 4.5 스트리밍 호출"""
    bedrock = get_bedrock_client()
    
    messages = [{"role": "user", "content": prompt}]
    
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 16000,  # 명세서를 위해 증가
        "messages": messages,
        "temperature": 0.5
    }
    
    if system_prompt:
        body["system"] = system_prompt
    
    response = bedrock.invoke_model_with_response_stream(
        modelId="global.anthropic.claude-sonnet-4-5-20250929-v1:0",
        body=json.dumps(body)
    )
    
    for event in response['body']:
        chunk = json.loads(event['chunk']['bytes'])
        if chunk['type'] == 'content_block_delta':
            if 'delta' in chunk and 'text' in chunk['delta']:
                yield chunk['delta']['text']

# 세션 상태 초기화
if 'step' not in st.session_state:
    st.session_state.step = 1
if 'form_data' not in st.session_state:
    st.session_state.form_data = {}
if 'chat_messages' not in st.session_state:
    st.session_state.chat_messages = []
if 'analysis' not in st.session_state:
    st.session_state.analysis = None

# 헤더
st.title("🤖 P.A.T.H Agent Designer")
st.caption("AI Agent 아이디어를 프로토타입으로")

# 진행 상태
progress = (st.session_state.step - 1) / 3
st.progress(progress)

# 사이드바
with st.sidebar:
    st.header("📍 현재 단계")
    st.write("✅ Step 1: 기본 정보" if st.session_state.step > 1 else "⏳ Step 1: 기본 정보")
    st.write("✅ Step 2: Claude 분석" if st.session_state.step > 2 else "⏳ Step 2: Claude 분석")
    st.write("✅ Step 3: 결과" if st.session_state.step >= 3 else "⏳ Step 3: 결과")
    
    if st.session_state.analysis:
        st.markdown("---")
        st.metric("Feasibility", f"{st.session_state.analysis.get('feasibility_score', 0)}/50")
    
    st.markdown("---")
    
    # 새로운 분석 시작 버튼
    if st.button("🔄 새로운 분석 시작", use_container_width=True, type="primary"):
        st.session_state.clear()
        st.rerun()
    
    st.markdown("---")
    st.header("💾 세션 관리")
    
    # 이전 세션 불러오기
    with st.expander("📂 이전 세션 불러오기"):
        recent_sessions = list_recent_sessions(10)
        
        if recent_sessions:
            for session in recent_sessions:
                session_id = session['session_id']
                timestamp = session.get('timestamp', '')[:16]  # YYYY-MM-DDTHH:MM
                pain_point = session.get('pain_point', '')[:30] + '...'
                score = session.get('feasibility_score', 0)
                
                col1, col2 = st.columns([3, 1])
                
                with col1:
                    if st.button(f"📅 {timestamp}\n{pain_point}\n점수: {score}/50", key=f"load_{session_id}", use_container_width=True):
                        loaded = load_from_dynamodb(session_id)
                        if loaded:
                            # 세션 복원
                            st.session_state.form_data = {
                                'pain_point': loaded.get('pain_point', ''),
                                'input_type': loaded.get('input_type', ''),
                                'process_steps': loaded.get('process_steps', []),
                                'output_type': loaded.get('output_type', ''),
                                'human_loop': loaded.get('human_loop', ''),
                                'data_source': loaded.get('data_source', ''),
                                'error_tolerance': loaded.get('error_tolerance', ''),
                                'additional_context': loaded.get('additional_context', '')
                            }
                            st.session_state.chat_messages = loaded.get('chat_history', [])
                            st.session_state.analysis = {
                                'pain_point': loaded.get('pain_point', ''),
                                'input_type': loaded.get('input_type', ''),
                                'process_steps': loaded.get('process_steps', []),
                                'output_type': loaded.get('output_type', ''),
                                'output_detail': loaded.get('output_detail', ''),
                                'human_loop': loaded.get('human_loop', ''),
                                'pattern': loaded.get('pattern', ''),
                                'pattern_reason': loaded.get('pattern_reason', ''),
                                'feasibility_breakdown': loaded.get('feasibility_breakdown', {}),
                                'feasibility_score': loaded.get('feasibility_score', 0),
                                'recommendation': loaded.get('recommendation', ''),
                                'risks': loaded.get('risks', []),
                                'next_steps': loaded.get('next_steps', [])
                            }
                            st.session_state.spec = loaded.get('specification', '')
                            st.session_state.step = 3
                            st.success(f"세션 로드 완료!")
                            st.rerun()
                
                with col2:
                    if st.button("🗑️", key=f"delete_{session_id}", use_container_width=True, help="삭제"):
                        if delete_from_dynamodb(session_id):
                            st.success("삭제 완료!")
                            st.rerun()
                
                st.markdown("---")
        else:
            st.info("저장된 세션이 없습니다.")
    
    st.markdown("---")
    st.header("📚 P.A.T.H 프레임워크")
    
    with st.expander("💡 P.A.T.H 프레임워크?"):
        st.markdown("""
**P.A.T.H** = Problem → Agent Pattern → Technical → Handoff

AI Agent 아이디어를 **프로토타입으로 검증**하는 구조화된 방법론입니다.

**목표:**
- 막연한 아이디어를 구조화
- 실현 가능성 정량 평가
- 코딩 전 실패 가능성 조기 발견
""")
    
    with st.expander("🔍 P: Problem Decomposition"):
        st.markdown("""
**Pain Point를 4가지 요소로 분해:**

1. **INPUT**: 무엇이 트리거인가?
   - Event-Driven, Scheduled, On-Demand
   - Streaming, Conditional
   
2. **PROCESS**: 무슨 작업이 필요한가?
   - 데이터 수집, 분석/분류, 판단/평가
   - 콘텐츠 생성, 검증/개선, 실행/연동
   
3. **OUTPUT**: 결과물은 무엇인가?
   - Decision, Content, Notification
   - Action, Insight
   
4. **HUMAN-IN-LOOP**: 사람 개입 시점은?
   - None, Review, Exception, Collaborate
""")
    
    with st.expander("🎯 A: Agent Pattern Mapping"):
        st.markdown("""
**Andrew Ng의 4가지 패턴:**

- **Reflection**: 품질 검증 후 개선
  - 예: 코드 생성, 제안서 작성
  
- **Tool Use**: 외부 도구/API 호출
  - 예: 웹 검색, DB 조회, 계산
  
- **Planning**: 단계별 분해 실행
  - 예: 여행 계획, 보고서 작성
  
- **Multi-Agent**: 여러 에이전트 협업
  - 예: 시장 조사, 코드 리뷰
""")
    
    with st.expander("📊 T: Technical Feasibility"):
        st.markdown("""
**5개 항목 평가 (총 50점):**

1. **데이터 접근성** (10점)
   - MCP 서버 → API → 파일 → DB → 스크래핑
   
2. **판단 기준 명확성** (10점)
   - 명확한 규칙 → 예시 많음 → 직감
   
3. **오류 허용도** (10점)
   - 틀려도 OK → 리뷰 → 90%+ 필요
   
4. **지연 요구사항** (10점)
   - 몇 시간 → 몇 분 → 실시간
   
5. **통합 복잡도** (10점)
   - 독립 실행 → 1-2개 → 레거시

**판정:**
- 40-50점: ✅ 즉시 시작
- 30-40점: ⚠️ 조건부
- 20-30점: 🔄 개선 필요
- 20점 미만: ❌ 대안 모색
""")
    
    with st.expander("📋 H: Handoff Specification"):
        st.markdown("""
**최종 산출물:**

- 구현 명세서 (Markdown)
- Architecture 다이어그램
- Agent 컴포넌트 정의
- Risk & Mitigation
- Success Metrics

→ 개발팀에 전달하여 프로토타입 구현
""")
    
    st.markdown("---")
    st.caption("💡 Tip: 각 단계를 신중히 작성하면 더 정확한 분석이 가능합니다.")

# ============================================
# Step 1: 구조화된 폼 입력
# ============================================
# Step 1: 구조화된 폼 입력
# ============================================
if st.session_state.step == 1:
    st.header("1️⃣ 기본 정보 입력")
    st.caption("핵심 정보만 입력하세요. Claude가 나머지를 분석합니다.")
    
    # 안내 메시지
    st.info("""
    **💡 이 단계에서는:**
    - AI Agent로 해결하고 싶은 문제를 입력합니다
    - INPUT (트리거), PROCESS (작업), OUTPUT (결과물), Human-in-Loop을 선택합니다
    - 입력한 정보를 바탕으로 Claude가 상세 분석을 진행합니다
    
    **⏱️ 소요 시간:** 약 3-5분
    """)
    
    with st.form("basic_info"):
        # 필수 정보만
        pain_point = st.text_area(
            "해결하고 싶은 문제 (Pain Point) *",
            placeholder="예: 하루 100건 고객 이메일 답변에 2시간 소요",
            height=100,
            help="구체적으로 작성할수록 정확한 분석이 가능합니다"
        )
        
        col1, col2 = st.columns(2)
        
        with col1:
            input_type = st.selectbox(
                "INPUT: 언제 실행되나요? *",
                ["Event-Driven (이벤트 발생 시)",
                 "Scheduled (정해진 시간)",
                 "On-Demand (사용자 요청)",
                 "Streaming (실시간 스트림)",
                 "Conditional (조건 충족 시)"]
            )
            
            output_type = st.selectbox(
                "OUTPUT: 최종 결과물은? *",
                ["Decision (의사결정: 승인/거절, 분류, 점수)",
                 "Content (콘텐츠: 문서, 이메일, 보고서)",
                 "Notification (알림: Slack, 이메일, SMS)",
                 "Action (액션: 티켓 생성, API 호출, DB 업데이트)",
                 "Insight (인사이트: 분석, 추천, 예측)"]
            )
        
        with col2:
            process_steps = st.multiselect(
                "PROCESS: 어떤 작업이 필요한가요? (복수선택 가능)*",
                ["데이터 수집 (여러 소스에서 정보 조회)",
                 "분석/분류 (패턴 인식, 카테고리 분류, 이상 탐지)",
                 "판단/평가 (의사결정, 점수 산정, 우선순위 결정)",
                 "콘텐츠 생성 (문서, 이메일, 코드, 보고서 작성)",
                 "검증/개선 (품질 확인, 오류 수정, 반복 개선)",
                 "실행/연동 (API 호출, DB 업데이트, 알림)"],
                help="여러 개 선택 가능"
            )
            
            human_loop = st.selectbox(
                "HUMAN-IN-LOOP: 사람 개입 시점은? *",
                ["None (완전 자동)",
                 "Review (실행 전 승인 필요)",
                 "Exception (불확실할 때만)",
                 "Collaborate (AI와 함께 작업)"]
            )
        
        col3, col4 = st.columns(2)
        
        with col3:
            data_source = st.text_input(
                "데이터는 어디서 가져오나요?",
                placeholder="예: MCP 서버, Gmail API, S3, DynamoDB, 웹 스크래핑"
            )
        
        with col4:
            error_tolerance = st.selectbox(
                "오류 허용도는?",
                ["틀려도 괜찮음 (낮은 리스크)",
                 "사람이 검토 후 실행",
                 "높은 정확도 필요 (90%+)",
                 "매우 높은 정확도 필요 (99%+)"]
            )
        
        # 선택 정보
        with st.expander("📝 추가 정보 (선택사항)"):
            additional_context = st.text_area(
                "추가로 알려주고 싶은 내용",
                placeholder="예: 과거 데이터 1000건 있음, 법무팀 검토 필수, 실시간 처리 필요 등",
                height=80
            )
        
        submitted = st.form_submit_button("🤖 Claude 분석 시작", use_container_width=True)
        
        if submitted and pain_point and process_steps:
            st.session_state.form_data = {
                'pain_point': pain_point,
                'input_type': input_type,
                'process_steps': process_steps,
                'output_type': output_type,
                'human_loop': human_loop,
                'data_source': data_source,
                'error_tolerance': error_tolerance,
                'additional_context': additional_context
            }
            st.session_state.step = 2
            st.rerun()
        elif submitted and not pain_point:
            st.error("Pain Point는 필수 입력 항목입니다.")
        elif submitted and not process_steps:
            st.error("PROCESS 작업을 최소 1개 이상 선택해주세요.")

# ============================================
# Step 2: Claude 분석 + 대화형 보완
# ============================================
elif st.session_state.step == 2:
    st.header("2️⃣ Claude 분석 및 보완")
    
    data = st.session_state.form_data
    
    # 초기 분석 (한 번만)
    if len(st.session_state.chat_messages) == 0:
        with st.spinner("Claude가 분석 중입니다..."):
            
            initial_prompt = f"""다음 AI Agent 아이디어를 P.A.T.H 프레임워크로 분석하세요:

**Pain Point**: {data['pain_point']}
**INPUT Type**: {data['input_type']}
**PROCESS Steps**: {', '.join(data['process_steps'])}
**OUTPUT Type**: {data['output_type']}
**HUMAN-IN-LOOP**: {data['human_loop']}
**Data Source**: {data['data_source']}
**Error Tolerance**: {data['error_tolerance']}
**Additional Context**: {data['additional_context']}

다음 작업을 수행하세요:

1. 입력 내용을 분석하여 PROCESS 단계를 상세화
2. 가장 적합한 패턴 추천 (Reflection/Tool Use/Planning/Multi-Agent) 필요하다면 패턴을 조합해도됨. ex)Planning+Tool Use
3. 추가로 필요한 정보가 있다면 3-5개 질문 생성
4. 현재 정보만으로 Feasibility 예비 평가 (0-50점)

다음 형식으로 응답:

## 📊 초기 분석

**추론된 PROCESS 단계:**
- [단계들]

**추천 패턴:** [패턴명]
**이유:** [설명]

**예비 Feasibility:** [점수]/50
- 데이터 접근성: [점수]/10
- 판단 명확성: [점수]/10
- 오류 허용도: [점수]/10
- 지연 요구사항: [점수]/10
- 통합 복잡도: [점수]/10

## ❓ 추가 질문

더 정확한 분석을 위해 다음을 알려주세요:
1. [질문1]
2. [질문2]
3. [질문3]

답변하시면 최종 분석을 진행합니다. 또는 "분석 완료"를 입력하면 현재 정보로 진행합니다."""

            system_prompt = """당신은 P.A.T.H (Problem-Agent-Technical-Handoff) 프레임워크 전문가입니다.

# P.A.T.H 프레임워크란?

AI Agent 아이디어를 **"만들 가치가 있는지"** 빠르게 검증하고, **작동하는 프로토타입**까지 가는 구조화된 방법론입니다.

## 왜 이 프레임워크를 사용하는가?

**해결하는 문제:**
- ❌ "이거 AI로 할 수 있을까?" → 막연한 고민으로 시간 낭비
- ❌ "일단 만들어보자" → 개발 후 "이거 안 되네" 발견
- ❌ "어디서부터 시작하지?" → 방향성 없이 헤맴

**제공하는 가치:**
- ✅ 실현 가능성을 정량적으로 평가 (50점 척도)
- ✅ 구현 패턴 및 로드맵 제시
- ✅ Go/No-Go 의사결정 근거 제공
- ✅ 코딩 전에 실패 가능성 조기 발견

**목표:** 프로토타입 성공 가능성 평가 (프로덕션 배포 가이드 아님)

---

## Phase 1: PROBLEM Decomposition (문제 분해)

Pain Point를 4가지 요소로 분해:

### 1. INPUT (트리거)
- **Event-Driven (이벤트)**: 외부 시스템 이벤트 발생 시 (이메일 도착, 파일 업로드, 웹훅)
- **Scheduled (스케줄)**: 정해진 시간에 자동 실행 (매일 오전 9시, 매주 월요일)
- **On-Demand (요청)**: 사용자가 직접 실행 (버튼 클릭, API 호출, CLI)
- **Streaming (스트리밍)**: 실시간 데이터 스트림 처리 (로그 분석, IoT 센서, 거래 모니터링)
- **Conditional (조건부)**: 특정 조건/임계값 충족 시 (알람 발생, 이상 탐지, 상태 변경)

### 2. PROCESS (작업 단계)
- **데이터 수집**: 여러 소스에서 정보 조회 (API, DB, 파일, 웹)
- **분석/분류**: 패턴 인식, 카테고리 분류, 이상 탐지
- **판단/평가**: 규칙 기반 의사결정, 점수 산정, 우선순위 결정
- **콘텐츠 생성**: 문서, 이메일, 코드, 보고서 작성
- **검증/개선**: 품질 확인, 오류 수정, 반복 개선
- **실행/연동**: API 호출, DB 업데이트, 알림 전송

### 3. OUTPUT (결과물)
- **Decision (의사결정)**: 승인/거절, 분류, 점수, 우선순위
- **Content (콘텐츠)**: 문서, 이메일, 보고서, 코드, 제안서
- **Notification (알림)**: 이메일, Slack, SMS, 대시보드 알림
- **Action (액션)**: 티켓 생성, API 호출, 워크플로우 트리거, DB 업데이트
- **Insight (인사이트)**: 분석 결과, 추천, 예측, 트렌드

### 4. HUMAN-IN-LOOP (사람 개입 시점)
- **None**: 완전 자동 (높은 신뢰도, 낮은 리스크)
- **Review**: 실행 전 승인 필요 (중요한 의사결정)
- **Exception**: 불확실할 때만 개입 (confidence threshold)
- **Collaborate**: AI와 사람이 함께 작업 (복잡한 크리에이티브)

---

## Phase 2: AGENT Pattern Mapping (패턴 선택)

Andrew Ng의 Agentic Design Patterns 기반 4가지 패턴:

### Pattern 1: Reflection (반성)
- **언제**: OUTPUT 품질 검증 후 자가 개선 필요
- **예시**: 코드 생성(작성→테스트→수정), 제안서 작성(초안→검토→개선), SQL 최적화
- **장점**: 높은 품질 보장, 자동 오류 수정, 점진적 개선
- **단점**: 예측 불가한 시간, 무한 루프 위험, 비용 증가

### Pattern 2: Tool Use (도구 사용)
- **언제**: 외부 도구/API 호출이 필요한 단순 작업
- **예시**: 계산기 사용, 웹 검색, DB 조회, API 호출, 파일 읽기/쓰기
- **장점**: 빠른 구현, 명확한 기능, 쉬운 디버깅
- **단점**: 복잡한 추론 어려움, 도구 의존성

### Pattern 3: Planning (계획)
- **언제**: 복잡한 작업을 단계별로 분해하여 순차 실행
- **예시**: 여행 계획, 연구 보고서 작성, 프로젝트 관리, 데이터 분석 파이프라인
- **장점**: 복잡한 워크플로우 처리, 각 단계 독립 개발, 명확한 진행 상황
- **단점**: 계획 변경 어려움, 전체 시간 = 각 단계 합

### Pattern 4: Multi-Agent (다중 에이전트)
- **언제**: 여러 전문 에이전트가 협업하거나 병렬 작업
- **예시**: 시장 조사(웹+DB+PDF 동시), 코드 리뷰(여러 관점), 다국어 번역 검증
- **장점**: 전문화된 역할, 병렬 처리 가능, 확장성
- **단점**: 조율 복잡, 결과 통합 로직 필요, 높은 비용

---

## Phase 3: Feasibility Check (실현 가능성 평가)

5개 항목을 평가하여 총 50점 만점으로 산정:

### 1. 데이터 접근성 (10점)
- **10점**: MCP 서버 존재 (Model Context Protocol로 통합)
- **9점**: API 존재 (REST/GraphQL로 접근 가능)
- **7점**: 파일 기반 (S3, 로컬 파일)
- **6점**: DB 직접 접근 (SQL 쿼리)
- **3점**: 화면 스크래핑 (Selenium, 불안정)
- **0점**: 오프라인만 존재 (디지털화 필요)

### 2. 판단 기준 명확성 (10점)
- **10점**: 명확한 if-then 규칙으로 표현 가능
- **8점**: 100+ 레이블링된 예시 존재
- **6점**: 암묵적 패턴 있으나 문서화 안됨
- **4점**: 전문가 직감에 의존
- **2점**: "그냥 알 수 있어요" (설명 불가)

### 3. 오류 허용도 (10점)
- **10점**: 틀려도 괜찮음 (낮은 리스크, 쉬운 복구)
- **8점**: 리뷰 후 실행 (사람이 승인)
- **5점**: 90%+ 정확도 필요 (모니터링 필수)
- **3점**: 99%+ 정확도 필요 (테스트 많음)
- **0점**: 무조건 100% (현재 LLM 불가능)

### 4. 지연 요구사항 (10점)
- **10점**: 몇 시간 OK (배치 처리)
- **9점**: 몇 분 OK (비동기)
- **7점**: 1분 이내 (빠른 LLM)
- **5점**: 10초 이내 (최적화 필요)
- **3점**: 실시간 <3초 (캐싱+최적화 필수)

### 5. 통합 복잡도 (10점)
- **10점**: 독립 실행 (통합 불필요)
- **8점**: 1-2개 시스템 (API 통합 간단)
- **5점**: 3-5개 시스템 (여러 통합 포인트)
- **3점**: 레거시 시스템 (복잡한 통합, 문서 부족)
- **1점**: 커스텀 프로토콜 (새 어댑터 개발)

### 판정 기준
- **40-50점**: ✅ 즉시 프로토타입 시작 (높은 성공 가능성, 빠른 검증)
- **30-40점**: ⚠️ 조건부 진행 (리스크 요소 파악, 범위 축소 고려)
- **20-30점**: 🔄 데이터/프로세스 개선 후 재평가 (선행 작업 필요)
- **20점 미만**: ❌ 대안 모색 (AI Agent 부적합, 전통적 자동화 고려)

---

## 당신의 역할

1. **분석**: 사용자 입력을 분석하여 PROCESS 단계를 추론하고 구조화
2. **추천**: 4가지 패턴 중 가장 적합한 것을 선택하고 명확한 이유 제시
3. **질문**: 부족한 정보는 구체적이고 실용적인 질문으로 보완 (최대 3개, 핵심만)
4. **평가**: Feasibility 점수를 각 항목별 근거와 함께 산정
5. **판단**: 프로토타입 성공 가능성, 리스크, 다음 단계를 명확히 제시

**중요: 이것은 프로토타입 검증이므로 완벽한 정보보다는 빠른 의사결정이 중요합니다.**
**추가 질문은 정말 필수적인 것만 최대 3개까지만 하세요.**
**3턴 이상 대화가 길어지면 현재 정보로 분석을 진행하세요.**

**대화 스타일:**
- 친절하고 전문적으로
- 실무에서 바로 사용 가능한 분석 제공
- 낙관적이지 않고 현실적으로 평가
- 리스크를 숨기지 않고 명확히 제시"""

            # 스트리밍으로 초기 분석 표시
            with st.chat_message("assistant"):
                message_placeholder = st.empty()
                full_response = ""
                
                for chunk in call_claude_stream(initial_prompt, system_prompt):
                    full_response += chunk
                    message_placeholder.markdown(full_response + "▌")
                
                message_placeholder.markdown(full_response)
            
            st.session_state.chat_messages.append({
                "role": "assistant",
                "content": full_response
            })
            st.rerun()
    
    # 채팅 히스토리 표시
    for msg in st.session_state.chat_messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
    
    # 사용자 입력
    col1, col2 = st.columns([4, 1])
    
    with col1:
        user_input = st.chat_input("답변을 입력하거나 '분석 완료'를 입력하세요...")
    
    with col2:
        if st.button("✅ 분석 완료", use_container_width=True):
            user_input = "분석 완료"
    
    if user_input:
        # 사용자 메시지 먼저 표시
        with st.chat_message("user"):
            st.markdown(user_input)
        
        # 사용자 메시지 저장
        st.session_state.chat_messages.append({
            "role": "user",
            "content": user_input
        })
        
        # "분석 완료" 체크
        if "분석 완료" in user_input or "완료" in user_input:
            with st.spinner("최종 분석 중..."):
                
                # 전체 대화 컨텍스트 (너무 길면 요약)
                conversation = "\n\n".join([
                    f"{m['role'].upper()}: {m['content'][:500]}..." if len(m['content']) > 500 else f"{m['role'].upper()}: {m['content']}"
                    for m in st.session_state.chat_messages
                ])
                
                system_prompt = """당신은 P.A.T.H 프레임워크 전문가입니다.
사용자와의 대화를 바탕으로 최종 분석을 수행하고 JSON 형식으로 출력합니다.
간결하고 정확하게 작성하세요."""
                
                final_prompt = f"""다음은 지금까지의 분석 내용입니다:

{conversation}

이제 최종 분석을 수행하세요. 다음을 JSON 형식으로 출력:

{{
  "pain_point": "사용자 Pain Point",
  "input_type": "INPUT 타입",
  "input_detail": "INPUT 상세",
  "process_steps": ["단계1: 설명", "단계2: 설명", "..."],
  "output_type": "OUTPUT 타입",
  "output_detail": "OUTPUT 상세",
  "human_loop": "None/Review/Exception/Collaborate",
  "pattern": "Reflection/Tool Use/Planning/Multi-Agent",
  "pattern_reason": "패턴 선택 이유",
  "feasibility_breakdown": {{
    "data_access": 0-10,
    "decision_clarity": 0-10,
    "error_tolerance": 0-10,
    "latency": 0-10,
    "integration": 0-10
  }},
  "feasibility_score": 0-50,
  "recommendation": "추천 사항",
  "risks": ["리스크1", "리스크2"],
  "next_steps": ["단계1", "단계2"]
}}

JSON만 출력하세요."""

                response = call_claude(final_prompt, system_prompt)
                
                # JSON 추출
                json_start = response.find("{")
                json_end = response.rfind("}") + 1
                
                if json_start != -1 and json_end > json_start:
                    analysis_json = response[json_start:json_end]
                    st.session_state.analysis = json.loads(analysis_json)
                    st.session_state.step = 3
                    st.rerun()
        
        else:
            # 추가 대화 - 스트리밍
            conversation = "\n\n".join([
                f"{m['role'].upper()}: {m['content']}"
                for m in st.session_state.chat_messages
            ])
            
            continue_prompt = f"""{conversation}

사용자의 답변을 반영하여:
1. 추가 정보가 더 필요하면 구체적으로 질문 (최대 3개)
2. 충분하면 "이제 최종 분석을 진행할 수 있습니다. '분석 완료'를 입력하세요." 안내

자연스럽게 대화하세요."""

            system_prompt = """당신은 P.A.T.H (Problem-Agent-Technical-Handoff) 프레임워크 전문가입니다.

# P.A.T.H 프레임워크란?

AI Agent 아이디어를 **"만들 가치가 있는지"** 빠르게 검증하고, **작동하는 프로토타입**까지 가는 구조화된 방법론입니다.

## 왜 이 프레임워크를 사용하는가?

**해결하는 문제:**
- ❌ "이거 AI로 할 수 있을까?" → 막연한 고민으로 시간 낭비
- ❌ "일단 만들어보자" → 개발 후 "이거 안 되네" 발견
- ❌ "어디서부터 시작하지?" → 방향성 없이 헤맴

**제공하는 가치:**
- ✅ 20-30분 안에 아이디어를 구조화
- ✅ 실현 가능성을 정량적으로 평가 (50점 척도)
- ✅ 구현 패턴 및 로드맵 제시
- ✅ Go/No-Go 의사결정 근거 제공
- ✅ 코딩 전에 실패 가능성 조기 발견

**목표:** 프로토타입 성공 가능성 평가 (프로덕션 배포 가이드 아님)

---

## Phase 1: PROBLEM Decomposition (문제 분해)

Pain Point를 4가지 요소로 분해:

### 1. INPUT (트리거)
- **Event-Driven (이벤트)**: 외부 시스템 이벤트 발생 시 (이메일 도착, 파일 업로드, 웹훅)
- **Scheduled (스케줄)**: 정해진 시간에 자동 실행 (매일 오전 9시, 매주 월요일)
- **On-Demand (요청)**: 사용자가 직접 실행 (버튼 클릭, API 호출, CLI)
- **Streaming (스트리밍)**: 실시간 데이터 스트림 처리 (로그 분석, IoT 센서, 거래 모니터링)
- **Conditional (조건부)**: 특정 조건/임계값 충족 시 (알람 발생, 이상 탐지, 상태 변경)

### 2. PROCESS (작업 단계)
- **데이터 수집**: 여러 소스에서 정보 조회 (API, DB, 파일, 웹)
- **분석/분류**: 패턴 인식, 카테고리 분류, 이상 탐지
- **판단/평가**: 규칙 기반 의사결정, 점수 산정, 우선순위 결정
- **콘텐츠 생성**: 문서, 이메일, 코드, 보고서 작성
- **검증/개선**: 품질 확인, 오류 수정, 반복 개선
- **실행/연동**: API 호출, DB 업데이트, 알림 전송

### 3. OUTPUT (결과물)
- **Decision (의사결정)**: 승인/거절, 분류, 점수, 우선순위
- **Content (콘텐츠)**: 문서, 이메일, 보고서, 코드, 제안서
- **Notification (알림)**: 이메일, Slack, SMS, 대시보드 알림
- **Action (액션)**: 티켓 생성, API 호출, 워크플로우 트리거, DB 업데이트
- **Insight (인사이트)**: 분석 결과, 추천, 예측, 트렌드

### 4. HUMAN-IN-LOOP (사람 개입 시점)
- **None**: 완전 자동 (높은 신뢰도, 낮은 리스크)
- **Review**: 실행 전 승인 필요 (중요한 의사결정)
- **Exception**: 불확실할 때만 개입 (confidence threshold)
- **Collaborate**: AI와 사람이 함께 작업 (복잡한 크리에이티브)

---

## Phase 2: AGENT Pattern Mapping (패턴 선택)

Andrew Ng의 Agentic Design Patterns 기반 4가지 패턴:

### Pattern 1: Reflection (반성)
- **언제**: OUTPUT 품질 검증 후 자가 개선 필요
- **예시**: 코드 생성(작성→테스트→수정), 제안서 작성(초안→검토→개선), SQL 최적화
- **장점**: 높은 품질 보장, 자동 오류 수정, 점진적 개선
- **단점**: 예측 불가한 시간, 무한 루프 위험, 비용 증가

### Pattern 2: Tool Use (도구 사용)
- **언제**: 외부 도구/API 호출이 필요한 단순 작업
- **예시**: 계산기 사용, 웹 검색, DB 조회, API 호출, 파일 읽기/쓰기
- **장점**: 빠른 구현, 명확한 기능, 쉬운 디버깅
- **단점**: 복잡한 추론 어려움, 도구 의존성

### Pattern 3: Planning (계획)
- **언제**: 복잡한 작업을 단계별로 분해하여 순차 실행
- **예시**: 여행 계획, 연구 보고서 작성, 프로젝트 관리, 데이터 분석 파이프라인
- **장점**: 복잡한 워크플로우 처리, 각 단계 독립 개발, 명확한 진행 상황
- **단점**: 계획 변경 어려움, 전체 시간 = 각 단계 합

### Pattern 4: Multi-Agent (다중 에이전트)
- **언제**: 여러 전문 에이전트가 협업하거나 병렬 작업
- **예시**: 시장 조사(웹+DB+PDF 동시), 코드 리뷰(여러 관점), 다국어 번역 검증
- **장점**: 전문화된 역할, 병렬 처리 가능, 확장성
- **단점**: 조율 복잡, 결과 통합 로직 필요, 높은 비용

---

## Phase 3: Feasibility Check (실현 가능성 평가)

5개 항목을 평가하여 총 50점 만점으로 산정:

### 1. 데이터 접근성 (10점)
- **10점**: MCP 서버 존재 (Model Context Protocol로 통합)
- **9점**: API 존재 (REST/GraphQL로 접근 가능)
- **7점**: 파일 기반 (S3, 로컬 파일)
- **6점**: DB 직접 접근 (SQL 쿼리)
- **3점**: 화면 스크래핑 (Selenium, 불안정)
- **0점**: 오프라인만 존재 (디지털화 필요)

### 2. 판단 기준 명확성 (10점)
- **10점**: 명확한 if-then 규칙으로 표현 가능
- **8점**: 100+ 레이블링된 예시 존재
- **6점**: 암묵적 패턴 있으나 문서화 안됨
- **4점**: 전문가 직감에 의존
- **2점**: "그냥 알 수 있어요" (설명 불가)

### 3. 오류 허용도 (10점)
- **10점**: 틀려도 괜찮음 (낮은 리스크, 쉬운 복구)
- **8점**: 리뷰 후 실행 (사람이 승인)
- **5점**: 90%+ 정확도 필요 (모니터링 필수)
- **3점**: 99%+ 정확도 필요 (테스트 많음)
- **0점**: 무조건 100% (현재 LLM 불가능)

### 4. 지연 요구사항 (10점)
- **10점**: 몇 시간 OK (배치 처리)
- **9점**: 몇 분 OK (비동기)
- **7점**: 1분 이내 (빠른 LLM)
- **5점**: 10초 이내 (최적화 필요)
- **3점**: 실시간 <3초 (캐싱+최적화 필수)

### 5. 통합 복잡도 (10점)
- **10점**: 독립 실행 (통합 불필요)
- **8점**: 1-2개 시스템 (API 통합 간단)
- **5점**: 3-5개 시스템 (여러 통합 포인트)
- **3점**: 레거시 시스템 (복잡한 통합, 문서 부족)
- **1점**: 커스텀 프로토콜 (새 어댑터 개발)

### 판정 기준
- **40-50점**: ✅ 즉시 프로토타입 시작 (높은 성공 가능성, 빠른 검증)
- **30-40점**: ⚠️ 조건부 진행 (리스크 요소 파악, 범위 축소 고려)
- **20-30점**: 🔄 데이터/프로세스 개선 후 재평가 (선행 작업 필요)
- **20점 미만**: ❌ 대안 모색 (AI Agent 부적합, 전통적 자동화 고려)

---

## 당신의 역할

1. **분석**: 사용자 입력을 분석하여 PROCESS 단계를 추론하고 구조화
2. **추천**: 4가지 패턴 중 가장 적합한 것을 선택하고 명확한 이유 제시
3. **질문**: 부족한 정보는 구체적이고 실용적인 질문으로 보완 (최대 3개, 핵심만)
4. **평가**: Feasibility 점수를 각 항목별 근거와 함께 산정
5. **판단**: 프로토타입 성공 가능성, 리스크, 다음 단계를 명확히 제시

**중요: 이것은 프로토타입 검증이므로 완벽한 정보보다는 빠른 의사결정이 중요합니다.**
**추가 질문은 정말 필수적인 것만 최대 3개까지만 하세요.**
**3턴 이상 대화가 길어지면 현재 정보로 분석을 진행하세요.**

**대화 스타일:**
- 친절하고 전문적으로
- 실무에서 바로 사용 가능한 분석 제공
- 낙관적이지 않고 현실적으로 평가
- 리스크를 숨기지 않고 명확히 제시"""

            # 스트리밍으로 응답 표시
            with st.chat_message("assistant"):
                message_placeholder = st.empty()
                full_response = ""
                
                for chunk in call_claude_stream(continue_prompt, system_prompt):
                    full_response += chunk
                    message_placeholder.markdown(full_response + "▌")
                
                message_placeholder.markdown(full_response)
            
            st.session_state.chat_messages.append({
                "role": "assistant",
                "content": full_response
            })
            st.rerun()

# ============================================
# Step 3: 결과 및 명세서
# ============================================
elif st.session_state.step == 3:
    st.header("3️⃣ 분석 결과")
    
    analysis = st.session_state.analysis
    
    # 요약 카드
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.metric("추천 패턴", analysis['pattern'])
    
    with col2:
        score = analysis['feasibility_score']
        st.metric("Feasibility", f"{score}/50")
    
    with col3:
        if score >= 40:
            st.metric("판정", "✅ Go", delta="높은 성공률")
        elif score >= 30:
            st.metric("판정", "⚠️ 조건부", delta="리스크 관리 필요")
        else:
            st.metric("판정", "🔄 개선 필요", delta="선행 작업 필요")
    
    # 탭으로 구분
    tab1, tab2, tab3, tab4, tab5 = st.tabs(["📊 상세 분석", "💬 대화 내역", "📋 명세서", "⚠️ 리스크", "🚀 다음 단계"])
    
    with tab1:
        st.subheader("📊 상세 분석")
        
        # 스크롤 가능한 컨테이너
        with st.container():
            col1, col2 = st.columns(2)
            
            with col1:
                st.markdown("### Problem Decomposition")
                
                with st.expander("📌 Pain Point", expanded=True):
                    st.write(analysis.get('pain_point', 'N/A'))
                
                with st.expander("📥 INPUT", expanded=True):
                    st.write(analysis.get('input_type', 'N/A'))
                
                with st.expander("⚙️ PROCESS", expanded=True):
                    process_steps = analysis.get('process_steps', [])
                    if isinstance(process_steps, list):
                        for i, step in enumerate(process_steps, 1):
                            st.write(f"{i}. {step}")
                    else:
                        st.write(process_steps)
                
                with st.expander("📤 OUTPUT", expanded=True):
                    st.write(analysis.get('output_type', 'N/A'))
                    if analysis.get('output_detail'):
                        st.caption(f"**상세:** {analysis['output_detail']}")
                
                with st.expander("👤 Human-in-Loop", expanded=True):
                    st.write(analysis.get('human_loop', 'N/A'))
                
                st.markdown("---")
                
                st.markdown("### 추가 정보")
                if st.session_state.form_data:
                    data_source = st.session_state.form_data.get('data_source', '')
                    if data_source:
                        st.write(f"**데이터 소스:** {data_source}")
                    
                    error_tolerance = st.session_state.form_data.get('error_tolerance', '')
                    if error_tolerance:
                        st.write(f"**오류 허용도:** {error_tolerance}")
                    
                    additional_context = st.session_state.form_data.get('additional_context', '')
                    if additional_context:
                        with st.expander("📝 추가 컨텍스트", expanded=False):
                            st.write(additional_context)
                
                st.markdown("---")
                
                st.markdown("### 추천 패턴")
                st.write(f"**패턴:** {analysis.get('pattern', 'N/A')}")
                if analysis.get('pattern_reason'):
                    with st.expander("💡 패턴 선택 이유", expanded=True):
                        st.info(analysis['pattern_reason'])
            
            with col2:
                st.markdown("### Feasibility 점수")
                breakdown = analysis.get('feasibility_breakdown', {})
                
                if breakdown:
                    total_score = sum(breakdown.values())
                    st.metric("총점", f"{total_score}/50")
                    st.markdown("---")
                    
                    for key, value in breakdown.items():
                        st.progress(value / 10, text=f"{key}: {value}/10")
                else:
                    st.warning("Feasibility 상세 점수가 없습니다.")
                
                st.markdown("---")
                
                st.markdown("### 최종 판정")
                recommendation = analysis.get('recommendation', 'N/A')
                if analysis.get('feasibility_score', 0) >= 40:
                    st.success(f"✅ {recommendation}")
                elif analysis.get('feasibility_score', 0) >= 30:
                    st.warning(f"⚠️ {recommendation}")
                else:
                    st.error(f"🔄 {recommendation}")
    
    with tab2:
        st.subheader("💬 대화 내역")
        
        if st.session_state.chat_messages:
            st.caption(f"총 {len(st.session_state.chat_messages)}개의 메시지")
            
            # 대화 내역 표시
            for msg in st.session_state.chat_messages:
                with st.chat_message(msg["role"]):
                    st.markdown(msg["content"])
        else:
            st.info("대화 내역이 없습니다.")
    
    with tab3:
        st.subheader("📄 구현 명세서")
        
        if st.button("🤖 Claude로 상세 명세서 생성", use_container_width=True):
            # Decimal 타입 변환
            analysis_clean = decimal_to_float(analysis)
            
            spec_prompt = """다음 분석 결과를 바탕으로 프로토타입 구현을 위한 명세서를 작성하세요:

""" + json.dumps(analysis_clean, indent=2, ensure_ascii=False) + """

다음 5개 섹션만 작성하세요:

# AI Agent Design Specification

## 1. Executive Summary
- **Problem**: 해결하려는 문제 (1-2문장)
- **Solution**: 선택된 패턴과 접근 방법
- **Feasibility Score**: X/50 (판정)
- **Go/No-Go**: 추천 사항

## 2. Problem Decomposition
### INPUT
- 트리거 타입과 상세 설명
- 데이터 소스

### PROCESS
- 각 단계별 상세 설명 (번호 매겨서)

### OUTPUT
- 결과물 타입과 형식
- 전달 방법

### Human-in-Loop
- 사람 개입 시점과 방법

## 3. Architecture

### 3.1 System Architecture
```mermaid
graph TB
    [전체 시스템 구조]
```

### 3.2 Sequence Diagram
```mermaid
sequenceDiagram
    [컴포넌트 간 상호작용]
```

### 3.3 Flow Chart
```mermaid
flowchart TD
    [처리 흐름]
```

## 4. Agent Components
| Agent Name | Role | Input | Output | LLM | Tools |
|------------|------|-------|--------|-----|-------|

## 5. Technical Stack
- **Framework**:
    - 이유: 
- **LLM**: 
    - 용도: 
    - 이유: 

---

**중요1**: 위 5개 섹션만 작성하세요. 프로토타입 구현에 필요한 핵심만 포함하세요.
**중요2**: 4. Agent Components에서 LLM은 Claude Opus, Sonnet, Haiku의 4.5 버전 모델들만 사용해야합니다.
**중요3**: 5. Technical Stack은 Framework와 LLM 항목만 작성하고 다른 항목은 추가하지 마세요. 
**중요4**: Framework는 Strands SDK만 사용합니다. LLM은 Claude Opus, Sonnet, Haiku의 4.5 버전 모델들만 사용해야합니다."""

            # 스트리밍으로 명세서 생성
            spec_container = st.empty()
            full_spec = ""
            
            for chunk in call_claude_stream(spec_prompt):
                full_spec += chunk
                spec_container.markdown(full_spec)
            
            st.session_state.spec = full_spec
        
        if 'spec' in st.session_state:
            st.download_button(
                "📥 명세서 다운로드 (Markdown)",
                st.session_state.spec,
                file_name=f"agent-spec-{datetime.now().strftime('%Y%m%d-%H%M')}.md",
                mime="text/markdown",
                use_container_width=True
            )
            
            with st.expander("📄 명세서 미리보기", expanded=True):
                st.markdown(st.session_state.spec)
    
    with tab4:
        st.subheader("⚠️ 리스크 및 고려사항")
        
        for risk in analysis.get('risks', []):
            st.warning(risk)
        
        if analysis['feasibility_score'] < 40:
            st.error("**주의:** Feasibility 점수가 낮습니다. 다음을 개선하세요:")
            
            breakdown = analysis['feasibility_breakdown']
            for key, value in breakdown.items():
                if value < 7:
                    st.write(f"- {key}: {value}/10 → 개선 필요")
    
    with tab5:
        st.subheader("🚀 다음 단계")
        
        for i, step in enumerate(analysis.get('next_steps', []), 1):
            st.write(f"{i}. {step}")
        
        st.markdown("---")
        
        # 세션 저장
        if st.button("💾 이 분석 결과 저장", use_container_width=True, type="primary"):
            session_data = {
                # Claude가 분석한 내용 저장 (analysis에서)
                'pain_point': analysis.get('pain_point', ''),
                'input_type': analysis.get('input_type', ''),
                'process_steps': analysis.get('process_steps', []),
                'output_type': analysis.get('output_type', ''),
                'output_detail': analysis.get('output_detail', ''),
                'human_loop': analysis.get('human_loop', ''),
                # 사용자 입력 추가 정보 (form_data에서)
                'data_source': st.session_state.form_data.get('data_source', ''),
                'error_tolerance': st.session_state.form_data.get('error_tolerance', ''),
                'additional_context': st.session_state.form_data.get('additional_context', ''),
                # Claude 분석 결과
                'pattern': analysis.get('pattern', ''),
                'pattern_reason': analysis.get('pattern_reason', ''),
                'feasibility_breakdown': analysis.get('feasibility_breakdown', {}),
                'feasibility_score': analysis.get('feasibility_score', 0),
                'recommendation': analysis.get('recommendation', ''),
                'risks': analysis.get('risks', []),
                'next_steps': analysis.get('next_steps', []),
                'chat_history': st.session_state.chat_messages,
                'specification': st.session_state.get('spec', '')
            }
            
            session_id = save_to_dynamodb(session_data)
            if session_id:
                st.success(f"✅ 저장 완료! Session ID: {session_id[:8]}...")
                st.info("사이드바 '이전 세션 불러오기'에서 확인할 수 있습니다.")
        
        st.markdown("---")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🔄 새로운 분석 시작", use_container_width=True):
                st.session_state.clear()
                st.rerun()
        
        with col2:
            if st.button("✏️ 수정하기", use_container_width=True):
                st.session_state.step = 1
                st.rerun()