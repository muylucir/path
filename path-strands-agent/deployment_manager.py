"""
배포 관리자 (AgentCore Runtime 배포 상태 관리)
"""
import uuid
import json
import time
import logging
from decimal import Decimal
from typing import Dict, Optional, Any, List, Union
from dataclasses import dataclass, asdict, field
from enum import Enum
import threading
from pathlib import Path

try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DeploymentStatus(str, Enum):
    PENDING = "pending"
    BUILDING = "building"
    PUSHING = "pushing"
    DEPLOYING = "deploying"
    ACTIVE = "active"
    STOPPED = "stopped"
    FAILED = "failed"


@dataclass
class InvocationRecord:
    """호출 기록"""
    timestamp: float
    latency_ms: int
    tokens_used: int
    success: bool


@dataclass
class Deployment:
    """배포 정보"""
    deployment_id: str
    job_id: str  # 연결된 코드 생성 작업 ID
    agent_name: str
    status: DeploymentStatus
    progress: int  # 0-100
    message: str
    version: int
    region: str
    created_at: float
    updated_at: float
    # 배포 결과
    runtime_id: Optional[str] = None  # AgentCore Runtime ID
    runtime_arn: Optional[str] = None
    s3_uri: Optional[str] = None  # S3 배포 패키지 URI (롤백용)
    endpoint_url: Optional[str] = None
    error: Optional[str] = None
    # 메타데이터 (UI 표시용)
    pain_point: Optional[str] = None
    pattern: Optional[str] = None
    feasibility_score: Optional[int] = None
    # 메트릭 필드
    total_invocations: int = 0
    total_tokens_used: int = 0
    avg_latency_ms: float = 0.0
    last_invocation_at: Optional[float] = None
    # Gateway/Identity 필드 (AgentCore 확장)
    gateway_id: Optional[str] = None
    gateway_url: Optional[str] = None
    identity_providers: Optional[List[str]] = None


class DeploymentManager:
    """배포 관리자 (DynamoDB + 파일 기반 하이브리드)"""

    def __init__(self, storage_dir: str = "/tmp/deployments", region: str = "us-west-2", use_dynamodb: bool = True):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        self.deployments: Dict[str, Deployment] = {}
        self.lock = threading.Lock()
        self.use_dynamodb = use_dynamodb and HAS_BOTO3

        # DynamoDB 초기화
        if self.use_dynamodb:
            try:
                self.dynamodb = boto3.resource('dynamodb', region_name=region)
                self.table = self.dynamodb.Table('path-agent-deployments')
                logger.info("✅ DynamoDB 연결 성공: path-agent-deployments")
            except Exception as e:
                logger.warning(f"⚠️  DynamoDB 연결 실패, 파일 저장소 사용: {e}")
                self.use_dynamodb = False
        else:
            logger.info("📁 파일 기반 저장소 사용")

        # 재시작 시 기존 배포 로드
        self._load_deployments()

    def create_deployment(
        self,
        job_id: str,
        agent_name: str,
        region: str = "us-west-2",
        pain_point: Optional[str] = None,
        pattern: Optional[str] = None,
        feasibility_score: Optional[int] = None
    ) -> str:
        """새 배포 생성"""
        deployment_id = str(uuid.uuid4())
        now = time.time()

        # 같은 job_id로 기존 배포가 있으면 버전 증가
        version = 1
        for d in self.deployments.values():
            if d.job_id == job_id:
                version = max(version, d.version + 1)

        deployment = Deployment(
            deployment_id=deployment_id,
            job_id=job_id,
            agent_name=agent_name,
            status=DeploymentStatus.PENDING,
            progress=0,
            message="배포 대기 중...",
            version=version,
            region=region,
            created_at=now,
            updated_at=now,
            pain_point=pain_point,
            pattern=pattern,
            feasibility_score=feasibility_score
        )

        with self.lock:
            self.deployments[deployment_id] = deployment
            self._save_deployment(deployment)

        return deployment_id

    def get_deployment(self, deployment_id: str) -> Optional[Deployment]:
        """배포 조회"""
        with self.lock:
            return self.deployments.get(deployment_id)

    def update_deployment(self, deployment_id: str, **kwargs):
        """배포 상태 업데이트"""
        with self.lock:
            if deployment_id not in self.deployments:
                return

            deployment = self.deployments[deployment_id]
            for key, value in kwargs.items():
                if hasattr(deployment, key):
                    setattr(deployment, key, value)

            deployment.updated_at = time.time()
            self._save_deployment(deployment)

    def delete_deployment(self, deployment_id: str) -> bool:
        """배포 삭제"""
        with self.lock:
            if deployment_id not in self.deployments:
                return False

            # 메모리에서 삭제
            del self.deployments[deployment_id]

            # DynamoDB에서 삭제
            if self.use_dynamodb:
                try:
                    self.table.delete_item(Key={'deployment_id': deployment_id})
                    logger.info(f"DynamoDB에서 배포 삭제: {deployment_id}")
                except Exception as e:
                    logger.error(f"DynamoDB 삭제 실패: {e}")

            # 파일에서 삭제
            deployment_file = self.storage_dir / f"{deployment_id}.json"
            if deployment_file.exists():
                deployment_file.unlink()

            return True

    def _save_deployment(self, deployment: Deployment):
        """배포를 파일 또는 DynamoDB에 저장"""
        deployment_dict = asdict(deployment)
        deployment_dict['status'] = deployment.status.value

        # DynamoDB에 저장
        if self.use_dynamodb:
            try:
                # DynamoDB는 float을 지원하지 않으므로 Decimal로 변환
                dynamodb_dict = deployment_dict.copy()
                for key in ['created_at', 'updated_at', 'avg_latency_ms', 'last_invocation_at']:
                    if dynamodb_dict.get(key) is not None:
                        dynamodb_dict[key] = Decimal(str(dynamodb_dict[key]))

                self.table.put_item(Item=dynamodb_dict)
                logger.debug(f"DynamoDB 저장: {deployment.deployment_id}")
            except Exception as e:
                logger.error(f"DynamoDB 저장 실패: {e}")
                # Fallback to file
                self._save_deployment_file(deployment, deployment_dict)
        else:
            self._save_deployment_file(deployment, deployment_dict)

    def _save_deployment_file(self, deployment: Deployment, deployment_dict: dict):
        """파일에 저장 (Fallback)"""
        deployment_file = self.storage_dir / f"{deployment.deployment_id}.json"
        with open(deployment_file, 'w') as f:
            json.dump(deployment_dict, f, ensure_ascii=False, indent=2)

    def _load_deployments(self):
        """저장된 배포들 로드 (DynamoDB 우선, Fallback은 파일)"""
        if self.use_dynamodb:
            self._load_from_dynamodb()
        else:
            self._load_from_files()

    def _load_from_dynamodb(self):
        """DynamoDB에서 배포 목록 로드"""
        try:
            response = self.table.scan()
            items = response.get('Items', [])

            for data in items:
                # 재시작 시 진행 중인 상태는 failed로 변경
                if data['status'] in [
                    DeploymentStatus.PENDING.value,
                    DeploymentStatus.BUILDING.value,
                    DeploymentStatus.PUSHING.value,
                    DeploymentStatus.DEPLOYING.value
                ]:
                    data['status'] = DeploymentStatus.FAILED.value
                    data['error'] = "서버 재시작으로 인한 배포 중단"

                deployment = Deployment(
                    deployment_id=data['deployment_id'],
                    job_id=data['job_id'],
                    agent_name=data['agent_name'],
                    status=DeploymentStatus(data['status']),
                    progress=data['progress'],
                    message=data['message'],
                    version=data['version'],
                    region=data['region'],
                    created_at=data['created_at'],
                    updated_at=data['updated_at'],
                    runtime_id=data.get('runtime_id'),
                    runtime_arn=data.get('runtime_arn'),
                    s3_uri=data.get('s3_uri'),
                    endpoint_url=data.get('endpoint_url'),
                    error=data.get('error'),
                    pain_point=data.get('pain_point'),
                    pattern=data.get('pattern'),
                    feasibility_score=data.get('feasibility_score'),
                    # 메트릭 필드
                    total_invocations=int(data.get('total_invocations', 0)),
                    total_tokens_used=int(data.get('total_tokens_used', 0)),
                    avg_latency_ms=float(data.get('avg_latency_ms', 0.0)),
                    last_invocation_at=data.get('last_invocation_at'),
                    # Gateway/Identity 필드
                    gateway_id=data.get('gateway_id'),
                    gateway_url=data.get('gateway_url'),
                    identity_providers=data.get('identity_providers')
                )

                self.deployments[deployment.deployment_id] = deployment

            logger.info(f"DynamoDB에서 {len(self.deployments)}개 배포 로드됨")
        except Exception as e:
            logger.error(f"DynamoDB 로드 실패: {e}")
            logger.info("파일 저장소에서 로드 시도...")
            self._load_from_files()

    def _load_from_files(self):
        """파일에서 배포 목록 로드"""
        for deployment_file in self.storage_dir.glob("*.json"):
            try:
                with open(deployment_file, 'r') as f:
                    data = json.load(f)

                # 재시작 시 진행 중인 상태는 failed로 변경
                if data['status'] in [
                    DeploymentStatus.PENDING.value,
                    DeploymentStatus.BUILDING.value,
                    DeploymentStatus.PUSHING.value,
                    DeploymentStatus.DEPLOYING.value
                ]:
                    data['status'] = DeploymentStatus.FAILED.value
                    data['error'] = "서버 재시작으로 인한 배포 중단"

                deployment = Deployment(
                    deployment_id=data['deployment_id'],
                    job_id=data['job_id'],
                    agent_name=data['agent_name'],
                    status=DeploymentStatus(data['status']),
                    progress=data['progress'],
                    message=data['message'],
                    version=data['version'],
                    region=data['region'],
                    created_at=data['created_at'],
                    updated_at=data['updated_at'],
                    runtime_id=data.get('runtime_id'),
                    runtime_arn=data.get('runtime_arn'),
                    s3_uri=data.get('s3_uri'),
                    endpoint_url=data.get('endpoint_url'),
                    error=data.get('error'),
                    pain_point=data.get('pain_point'),
                    pattern=data.get('pattern'),
                    feasibility_score=data.get('feasibility_score'),
                    # 메트릭 필드
                    total_invocations=int(data.get('total_invocations', 0)),
                    total_tokens_used=int(data.get('total_tokens_used', 0)),
                    avg_latency_ms=float(data.get('avg_latency_ms', 0.0)),
                    last_invocation_at=data.get('last_invocation_at'),
                    # Gateway/Identity 필드
                    gateway_id=data.get('gateway_id'),
                    gateway_url=data.get('gateway_url'),
                    identity_providers=data.get('identity_providers')
                )

                self.deployments[deployment.deployment_id] = deployment
            except Exception as e:
                print(f"배포 로드 실패 ({deployment_file}): {e}")

    def list_recent_deployments(self, limit: int = 10) -> list:
        """최근 배포 목록"""
        with self.lock:
            deployments = sorted(
                self.deployments.values(),
                key=lambda d: d.created_at,
                reverse=True
            )
            return deployments[:limit]

    def get_deployment_by_job(self, job_id: str) -> Optional[Deployment]:
        """특정 작업의 최신 배포 조회"""
        with self.lock:
            job_deployments = [d for d in self.deployments.values() if d.job_id == job_id]
            if not job_deployments:
                return None
            return max(job_deployments, key=lambda d: d.version)

    def record_invocation(
        self,
        deployment_id: str,
        latency_ms: int,
        tokens_used: int,
        success: bool = True
    ) -> bool:
        """호출 기록 및 메트릭 업데이트"""
        with self.lock:
            if deployment_id not in self.deployments:
                return False

            deployment = self.deployments[deployment_id]
            now = time.time()

            # 평균 latency 계산 (이동 평균)
            if deployment.total_invocations == 0:
                new_avg = float(latency_ms)
            else:
                # 가중 평균 계산
                total_latency = deployment.avg_latency_ms * deployment.total_invocations
                new_avg = (total_latency + latency_ms) / (deployment.total_invocations + 1)

            # 메트릭 업데이트
            deployment.total_invocations += 1
            deployment.total_tokens_used += tokens_used
            deployment.avg_latency_ms = round(new_avg, 2)
            deployment.last_invocation_at = now
            deployment.updated_at = now

            self._save_deployment(deployment)
            logger.debug(f"Recorded invocation for {deployment_id}: latency={latency_ms}ms, tokens={tokens_used}")
            return True

    def get_metrics(self, deployment_id: str) -> Optional[Dict[str, Any]]:
        """배포 메트릭 조회"""
        with self.lock:
            if deployment_id not in self.deployments:
                return None

            deployment = self.deployments[deployment_id]
            return {
                "deployment_id": deployment_id,
                "total_invocations": deployment.total_invocations,
                "total_tokens_used": deployment.total_tokens_used,
                "avg_latency_ms": deployment.avg_latency_ms,
                "last_invocation_at": deployment.last_invocation_at
            }

    def get_deployment_versions(self, job_id: str) -> List[Deployment]:
        """동일 job_id를 가진 모든 버전의 배포 조회"""
        with self.lock:
            job_deployments = [d for d in self.deployments.values() if d.job_id == job_id]
            return sorted(job_deployments, key=lambda d: d.version, reverse=True)

    def get_all_versions_by_agent(self, agent_name: str) -> List[Deployment]:
        """동일 agent_name을 가진 모든 배포 조회 (버전 히스토리)"""
        with self.lock:
            agent_deployments = [d for d in self.deployments.values() if d.agent_name == agent_name]
            return sorted(agent_deployments, key=lambda d: d.version, reverse=True)

    def get_deployment_by_version(self, agent_name: str, version: int) -> Optional[Deployment]:
        """특정 agent의 특정 버전 배포 조회"""
        with self.lock:
            for d in self.deployments.values():
                if d.agent_name == agent_name and d.version == version:
                    return d
            return None


# 싱글톤 인스턴스
deployment_manager = DeploymentManager()
