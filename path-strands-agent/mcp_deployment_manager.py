"""
MCP 서버 배포 관리자 (DynamoDB path-agent-integrations 테이블의 deployment 필드 업데이트)
"""
import os
import logging
import datetime
from typing import Optional, Dict, Any, List
from enum import Enum

try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MCPDeploymentStatus(str, Enum):
    """MCP 서버 배포 상태"""
    PENDING = "pending"
    DEPLOYING = "deploying"
    READY = "ready"
    FAILED = "failed"


class MCPDeploymentManager:
    """MCP 서버 배포 관리자 (DynamoDB 기반)"""

    def __init__(self, region: str = None):
        # DynamoDB 리전: path-agent-integrations 테이블이 있는 리전 (us-east-1)
        # AgentCore 리전(us-west-2)과 다를 수 있음
        self.region = region or os.environ.get("DYNAMODB_REGION", "us-east-1")
        self.table_name = "path-agent-integrations"

        if HAS_BOTO3:
            try:
                self.dynamodb = boto3.resource('dynamodb', region_name=self.region)
                self.table = self.dynamodb.Table(self.table_name)
                logger.info(f"MCP DeploymentManager: DynamoDB 연결 성공 ({self.table_name})")
            except Exception as e:
                logger.error(f"MCP DeploymentManager: DynamoDB 연결 실패: {e}")
                self.dynamodb = None
                self.table = None
        else:
            logger.warning("boto3 not installed - MCP deployment features disabled")
            self.dynamodb = None
            self.table = None

    def get_mcp_server(self, mcp_server_id: str) -> Optional[Dict[str, Any]]:
        """MCP 서버 정보 조회"""
        if not self.table:
            logger.warning("DynamoDB not available")
            return None

        try:
            response = self.table.get_item(Key={"id": mcp_server_id})
            item = response.get("Item")

            if not item:
                logger.warning(f"MCP server not found: {mcp_server_id}")
                return None

            if item.get("type") != "mcp-server":
                logger.warning(f"Invalid integration type: {item.get('type')}")
                return None

            return item

        except ClientError as e:
            logger.error(f"Failed to get MCP server: {e}")
            return None

    def get_next_version(self, mcp_server_id: str) -> int:
        """현재 버전 + 1 반환"""
        server = self.get_mcp_server(mcp_server_id)
        if not server:
            return 1

        current_version = server.get("deployment", {}).get("version", 0)
        return current_version + 1

    def update_deployment_status(
        self,
        mcp_server_id: str,
        status: MCPDeploymentStatus,
        runtime_arn: Optional[str] = None,
        endpoint_url: Optional[str] = None,
        runtime_id: Optional[str] = None,
        s3_uri: Optional[str] = None,
        error: Optional[str] = None,
        version: Optional[int] = None,
        progress: Optional[int] = None
    ) -> bool:
        """MCP 서버 배포 상태 업데이트"""
        if not self.table:
            logger.warning("DynamoDB not available")
            return False

        try:
            # 기존 아이템 조회
            response = self.table.get_item(Key={"id": mcp_server_id})
            item = response.get("Item")

            if not item:
                logger.error(f"MCP server not found: {mcp_server_id}")
                return False

            # deployment 필드 업데이트
            deployment = item.get("deployment", {})
            deployment["status"] = status.value

            if runtime_arn:
                deployment["runtimeArn"] = runtime_arn
            if endpoint_url:
                deployment["endpointUrl"] = endpoint_url
            if runtime_id:
                deployment["runtimeId"] = runtime_id
            if s3_uri:
                deployment["s3Uri"] = s3_uri
            if version is not None:
                deployment["version"] = version
            if progress is not None:
                deployment["progress"] = progress
            if error:
                deployment["error"] = error
            elif "error" in deployment and status == MCPDeploymentStatus.READY:
                # 성공 시 에러 제거
                del deployment["error"]

            if status == MCPDeploymentStatus.READY:
                import datetime
                now_iso = datetime.datetime.utcnow().isoformat() + "Z"
                deployment["lastDeployedAt"] = now_iso

                # 버전 히스토리 추가
                history = deployment.get("history", [])
                history_entry = {
                    "version": deployment.get("version", 1),
                    "s3Uri": deployment.get("s3Uri"),
                    "deployedAt": now_iso,
                    "runtimeArn": deployment.get("runtimeArn"),
                    "runtimeId": deployment.get("runtimeId")
                }
                history.append(history_entry)
                # 최근 10개 버전만 유지
                deployment["history"] = history[-10:]

            # 업데이트
            item["deployment"] = deployment
            item["updatedAt"] = datetime.datetime.utcnow().isoformat() + "Z" if status == MCPDeploymentStatus.READY else item.get("updatedAt")

            self.table.put_item(Item=item)
            logger.info(f"MCP deployment status updated: {mcp_server_id} -> {status.value} (v{deployment.get('version', 1)})")

            return True

        except ClientError as e:
            logger.error(f"Failed to update deployment status: {e}")
            return False

    def get_version_history(self, mcp_server_id: str) -> List[Dict[str, Any]]:
        """MCP 서버 버전 히스토리 조회"""
        server = self.get_mcp_server(mcp_server_id)
        if not server:
            return []

        deployment = server.get("deployment", {})
        return deployment.get("history", [])

    def get_deployment_status(self, mcp_server_id: str) -> Optional[Dict[str, Any]]:
        """MCP 서버 배포 상태 조회"""
        server = self.get_mcp_server(mcp_server_id)
        if not server:
            return None

        return server.get("deployment", {"status": "pending"})


# 싱글톤 인스턴스
mcp_deployment_manager = MCPDeploymentManager()
