"""file_read 도구의 경로 제한 래퍼"""
import os
from strands_tools import file_read

ALLOWED_BASE_DIR = os.path.realpath(
    os.path.join(os.path.dirname(__file__), "skills")
)


def safe_file_read(tool, **kwargs):
    """./skills/ 디렉토리만 접근 허용하는 file_read 래퍼"""
    if not isinstance(tool, dict):
        return {"status": "error", "content": [{"text": "Invalid tool call"}]}
    tool_input = tool.get("input", {})
    path = tool_input.get("path", "")
    if not path:
        return {"toolUseId": tool.get("toolUseId", ""), "status": "error",
                "content": [{"text": "Path parameter is required"}]}
    resolved = os.path.realpath(path)
    if not (resolved == ALLOWED_BASE_DIR or resolved.startswith(ALLOWED_BASE_DIR + os.sep)):
        return {
            "toolUseId": tool.get("toolUseId", ""),
            "status": "error",
            "content": [{"text": f"Access denied: {ALLOWED_BASE_DIR} 내 파일만 읽을 수 있습니다."}]
        }
    return file_read(tool, **kwargs)
