#!/bin/bash
# PATH Agent Designer — AgentCore deployment package builder
#
# ARM64 종속성을 포함한 ZIP 파일 생성 (Direct Code Deploy)
# 사용법: bash build-agent.sh
#
# 결과: deployment_package.zip (S3에 업로드 → CfnRuntime 참조)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PACKAGE_DIR="deployment_package"
ZIP_NAME="deployment_package.zip"

# 가상환경 pip 사용 (Python 3.11 resolver 보장)
if [ -f "venv/bin/pip" ]; then
  PIP="venv/bin/pip"
elif command -v pip3.11 &>/dev/null; then
  PIP="pip3.11"
else
  PIP="pip"
fi

echo "=== PATH Agent Designer — Build Deployment Package ==="
echo "Using pip: $PIP ($($PIP --version 2>&1 | head -1))"

# 1. 이전 빌드 정리
echo "[1/4] Cleaning previous build..."
rm -rf "$PACKAGE_DIR" "$ZIP_NAME"
mkdir -p "$PACKAGE_DIR"

# 2. ARM64 종속성 설치
echo "[2/4] Installing ARM64 dependencies..."
$PIP install \
  --platform manylinux2014_aarch64 \
  --target="$PACKAGE_DIR" \
  --only-binary=:all: \
  --python-version 3.11 \
  -r requirements.txt 2>&1 | tail -5

# 3. 에이전트 코드 복사
echo "[3/4] Copying agent code..."
# 핵심 Python 파일
cp agentcore_entrypoint.py "$PACKAGE_DIR/"
cp chat_agent.py "$PACKAGE_DIR/"
cp multi_stage_spec_agent.py "$PACKAGE_DIR/"
cp prompts.py "$PACKAGE_DIR/"
cp strands_utils.py "$PACKAGE_DIR/"
cp safe_tools.py "$PACKAGE_DIR/"
cp token_tracker.py "$PACKAGE_DIR/"

# agentskills 패키지
cp -r agentskills/ "$PACKAGE_DIR/agentskills/"

# skills 디렉토리 (file_read가 참조)
cp -r skills/ "$PACKAGE_DIR/skills/"

# 4. ZIP 패키징
echo "[4/4] Creating ZIP package..."
cd "$PACKAGE_DIR"
zip -r "../$ZIP_NAME" . -x "*.pyc" "__pycache__/*" > /dev/null
cd ..

# 결과 출력
SIZE=$(du -sh "$ZIP_NAME" | cut -f1)
echo ""
echo "=== Build Complete ==="
echo "Package: $ZIP_NAME ($SIZE)"
echo "Next: cd ../infra && npx cdk deploy"
