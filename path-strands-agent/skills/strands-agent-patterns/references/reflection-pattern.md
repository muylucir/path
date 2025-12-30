# Reflection Pattern (자기 검증)

## 개념
- Agent가 자신의 출력을 검증하고 개선
- 품질 보장을 위한 자가 피드백 루프
- Graph의 순환 구조로 구현

## 구현 방법
```python
# 생성 Agent
generator = Agent(
    name="generator",
    system_prompt="Generate high-quality content..."
)

# 검증 Agent
reviewer = Agent(
    name="reviewer",
    system_prompt="Review the content and provide feedback. Score 0-100."
)

# Reflection Graph 구축
builder = GraphBuilder()
builder.add_node(generator, "generator")
builder.add_node(reviewer, "reviewer")

# 순환 구조 생성
builder.add_edge("generator", "reviewer")

def needs_improvement(state):
    review = state.results.get("reviewer")
    if not review:
        return False
    # 점수가 70점 미만이면 재생성
    return "score" in str(review.result).lower() and int(re.search(r'\d+', str(review.result)).group()) < 70

builder.add_edge("reviewer", "generator", condition=needs_improvement)

# 무한 루프 방지
builder.set_max_node_executions(5)  # 최대 2-3회 반복
```

## 사용 시나리오
- 코드 생성 → 코드 리뷰 → 수정
- 문서 작성 → 품질 검증 → 개선
- 답변 생성 → 정확성 확인 → 재생성

## Best Practices
- 명확한 점수/평가 기준 설정
- 적절한 반복 횟수 제한 설정
- 개선 방향에 대한 구체적 피드백 요청
