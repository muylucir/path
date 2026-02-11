"""
Token Usage Tracker - AgentResult에서 토큰 사용량 추출 및 비용 추산
"""

# Claude Opus 4.5 Bedrock 가격 (per 1M tokens, USD)
PRICING = {
    "input": 15.00,
    "output": 75.00,
    "cache_write": 18.75,
    "cache_read": 1.875,
}


def extract_usage(result) -> dict:
    """AgentResult에서 토큰 사용량 + 비용 추출.

    Args:
        result: Strands AgentResult (result.metrics.accumulated_usage)

    Returns:
        토큰 사용량 및 추정 비용 dict
    """
    usage = result.metrics.accumulated_usage
    input_t = usage.get("inputTokens", 0)
    output_t = usage.get("outputTokens", 0)
    cache_read = usage.get("cacheReadInputTokens", 0)
    cache_write = usage.get("cacheWriteInputTokens", 0)

    cost = (
        (input_t / 1_000_000) * PRICING["input"]
        + (output_t / 1_000_000) * PRICING["output"]
        + (cache_read / 1_000_000) * PRICING["cache_read"]
        + (cache_write / 1_000_000) * PRICING["cache_write"]
    )

    return {
        "inputTokens": input_t,
        "outputTokens": output_t,
        "totalTokens": usage.get("totalTokens", 0),
        "cacheReadInputTokens": cache_read,
        "cacheWriteInputTokens": cache_write,
        "estimatedCostUSD": round(cost, 4),
    }


def merge_usage(a: dict, b: dict) -> dict:
    """두 usage dict 합산."""
    keys = [
        "inputTokens",
        "outputTokens",
        "totalTokens",
        "cacheReadInputTokens",
        "cacheWriteInputTokens",
    ]
    merged = {k: a.get(k, 0) + b.get(k, 0) for k in keys}
    merged["estimatedCostUSD"] = round(
        a.get("estimatedCostUSD", 0) + b.get("estimatedCostUSD", 0), 4
    )
    return merged
