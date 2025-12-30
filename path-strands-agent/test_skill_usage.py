#!/usr/bin/env python3
"""
Skill 사용 여부 테스트 스크립트
"""

from multi_stage_spec_agent import PatternAgent

# 간단한 분석 데이터
analysis = {
    'pain_point': 'Aurora DB 성능 문제 진단 자동화',
    'input_type': 'On-Demand',
    'process_steps': ['데이터 수집', '분석/분류'],
    'output_type': ['Content', 'Insight'],
    'human_loop': 'Review',
    'data_sources': 'CloudWatch, Aurora API',
    'error_tolerance': 'Low'
}

print("=" * 80)
print("PatternAgent 테스트 시작")
print("=" * 80)
print("\n🔍 Skill 로딩 로그를 확인하세요:")
print("   - '🔧 [SKILL] Loading: strands-agent-patterns' 가 나오면 성공")
print("   - 안 나오면 Agent가 skill_tool을 호출하지 않은 것\n")
print("-" * 80)

agent = PatternAgent()
result = agent.analyze(analysis)

print("-" * 80)
print("\n✅ 결과 (처음 500자):")
print(result[:500])
print("\n" + "=" * 80)
