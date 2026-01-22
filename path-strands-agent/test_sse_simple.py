"""
SSE 스트리밍 간단 테스트
"""
import asyncio
import json

async def simple_stream():
    """간단한 async generator 테스트"""
    yield json.dumps({"status": "progress", "progress": 10, "message": "시작"}) + "\n"
    await asyncio.sleep(0.1)
    yield json.dumps({"status": "progress", "progress": 50, "message": "중간"}) + "\n"
    await asyncio.sleep(0.1)
    yield json.dumps({"status": "complete", "progress": 100, "message": "완료"}) + "\n"

async def test():
    print("🧪 Async generator 테스트")
    async for chunk in simple_stream():
        print(f"📨 data: {chunk.strip()}")

if __name__ == "__main__":
    asyncio.run(test())
