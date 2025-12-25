"""
Strands Agent 테스트 - interview-prep 시나리오

PATH 웹앱 시나리오를 Strands Agent로 테스트
"""

import asyncio
import json
from chat_agent import AnalyzerAgent, ChatAgent, EvaluatorAgent
from spec_agent import SpecAgent

# interview-prep 시나리오 로드
with open('../path-test-agent/scenarios/interview-prep.json', 'r', encoding='utf-8') as f:
    scenario = json.load(f)

# PATH 웹앱 형식으로 변환
form_data = {
    "painPoint": scenario["painPoint"],
    "inputType": scenario["input"],
    "processSteps": scenario["process"],
    "outputTypes": scenario["output"],
    "humanLoop": scenario["humanInLoop"],
    "dataSources": [{"type": "API", "description": scenario["dataSources"]}],
    "errorTolerance": scenario["errorTolerance"],
    "additionalContext": ""
}

async def test_interview_prep():
    print("="*80)
    print("🎯 Interview Prep 시나리오 테스트")
    print("="*80)
    
    # Step 1: 초기 분석
    print("\n📍 Step 1: 초기 분석 (스트리밍)")
    print("-"*80)
    
    analyzer = AnalyzerAgent()
    analysis_text = ""
    
    async for chunk in analyzer.analyze_stream(form_data):
        print(chunk, end="", flush=True)
        analysis_text += chunk
    
    print("\n\n✅ 초기 분석 완료")
    
    # Step 2: 간단한 대화
    print("\n📍 Step 2: 대화")
    print("-"*80)
    
    chat_agent = ChatAgent()
    chat_agent.add_message("assistant", analysis_text)
    
    user_answer = "GitHub API는 공개 레포만 접근 가능하고, 이력서는 S3에 PDF로 저장되어 있습니다."
    print(f"👤 User: {user_answer}\n")
    print("🤖 Assistant (스트리밍):\n")
    
    async for chunk in chat_agent.chat_stream(user_answer):
        print(chunk, end="", flush=True)
    
    print("\n\n✅ 대화 완료")
    
    # Step 3: 최종 평가
    print("\n📍 Step 3: Feasibility 평가")
    print("-"*80)
    
    evaluator = EvaluatorAgent()
    evaluation = evaluator.evaluate(form_data, chat_agent.get_history())
    
    print(f"✅ 평가 완료")
    print(f"   총점: {evaluation['feasibility_score']}/50")
    print(f"   권장: {evaluation['recommendation']}")
    print(f"   패턴: {evaluation.get('pattern', 'N/A')}")
    
    # Step 4: 명세서 생성 (AgentCore)
    print("\n📍 Step 4: AgentCore 명세서 생성 (스트리밍)")
    print("-"*80)
    
    spec_agent = SpecAgent()
    
    print("\n📡 스트리밍 시작...\n")
    spec_text = ""
    async for chunk in spec_agent.generate_spec_stream(evaluation, use_agentcore=True):
        print(chunk, end="", flush=True)
        spec_text += chunk
    
    print("\n\n✅ 명세서 생성 완료")
    print(f"   길이: {len(spec_text)} 자")
    
    # 할루시네이션 체크
    print("\n📍 할루시네이션 체크")
    print("-"*80)
    
    if "TTL 없음" in spec_text or "영구 저장" in spec_text:
        print("✅ AgentCore Memory LTM TTL 정보 정확함")
    else:
        print("⚠️ AgentCore Memory TTL 정보 확인 필요")
    
    if "AgentCore Runtime" in spec_text:
        print("✅ AgentCore Runtime 언급됨")
    
    if "AgentCore Gateway" in spec_text:
        print("✅ AgentCore Gateway 언급됨")
    
    print("\n" + "="*80)
    print("🎉 전체 테스트 완료!")
    print("="*80)

if __name__ == "__main__":
    asyncio.run(test_interview_prep())
