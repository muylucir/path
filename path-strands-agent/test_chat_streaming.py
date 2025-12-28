"""
Chat Agent 스트리밍 및 채팅 기능 테스트
"""

import asyncio
from chat_agent import AnalyzerAgent, ChatAgent

# 테스트 데이터
form_data = {
    "painPoint": "고객 문의 이메일 자동 분류 및 답변",
    "inputType": "Event-Driven",
    "processSteps": ["데이터 수집", "분석/분류", "콘텐츠 생성"],
    "outputTypes": ["Content", "Action"],
    "humanLoop": "Review",
    "dataSources": [
        {"type": "API", "description": "이메일 시스템 API"},
        {"type": "Database", "description": "과거 답변 템플릿 DB"}
    ],
    "errorTolerance": "Medium",
    "additionalContext": "긴급 문의는 1시간 내 답변 필요"
}


async def test_streaming_analysis():
    """스트리밍 분석 테스트"""
    print("="*80)
    print("🔍 Test 1: 스트리밍 분석")
    print("="*80)
    
    analyzer = AnalyzerAgent()
    
    print("\n📡 스트리밍 시작...\n")
    async for chunk in analyzer.analyze_stream(form_data):
        print(chunk, end="", flush=True)
    
    print("\n\n✅ 스트리밍 완료!")


async def test_chat():
    """채팅 기능 테스트"""
    print("\n" + "="*80)
    print("💬 Test 2: 채팅 기능")
    print("="*80)
    
    chat_agent = ChatAgent()
    
    # 초기 분석 추가
    initial_analysis = """## 📊 초기 분석
예비 Feasibility: 40/50

## ❓ 추가 질문
1. 템플릿은 몇 개 정도 있나요?
2. 긴급 문의 판단 기준은?
"""
    chat_agent.add_message("assistant", initial_analysis)
    
    # 사용자 답변
    print("\n👤 User: 템플릿은 50개 정도 있고, 긴급 문의는 키워드 기반입니다.")
    print("\n🤖 Assistant (스트리밍):\n")
    
    async for chunk in chat_agent.chat_stream("템플릿은 50개 정도 있고, 긴급 문의는 키워드 기반입니다."):
        print(chunk, end="", flush=True)
    
    print("\n\n✅ 채팅 완료!")
    print(f"\n📝 대화 히스토리: {len(chat_agent.get_history())} 메시지")


async def main():
    """메인 테스트"""
    await test_streaming_analysis()
    await test_chat()
    
    print("\n" + "="*80)
    print("🎉 모든 테스트 완료!")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(main())
