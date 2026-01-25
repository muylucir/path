"""
배포 서비스 - boto3 API 기반 배포 (기본값)

AWS SDK (boto3)를 사용하여 AgentCore 배포:
- bedrock-agentcore-control: create/update/delete_agent_runtime
- bedrock-agentcore: invoke_agent_runtime
- s3: 배포 패키지 업로드
- Gateway/Identity 서비스 통합

CLI 방식도 지원하지만, CLI 출력 파싱 문제로 boto3를 권장합니다.
"""
import os
import subprocess
import tempfile
import shutil
import asyncio
import time
import json
import logging
import zipfile
import stat
import re
import yaml
from typing import Dict, Optional, Any, List, Callable
from pathlib import Path
from dataclasses import dataclass, field
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False
    logger.warning("boto3 not installed - AWS features disabled")

try:
    import aiohttp
    HAS_AIOHTTP = True
except ImportError:
    HAS_AIOHTTP = False
    logger.warning("aiohttp not installed - Runtime invocation will use mock")

# Gateway and Identity managers
from gateway_manager import gateway_manager, GatewayResult
from identity_manager import identity_manager


@dataclass
class DeploymentResult:
    """배포 결과"""
    success: bool
    s3_uri: Optional[str] = None
    runtime_id: Optional[str] = None
    runtime_arn: Optional[str] = None
    endpoint_url: Optional[str] = None
    error: Optional[str] = None
    # Gateway/Identity 관련 필드
    gateway_id: Optional[str] = None
    gateway_url: Optional[str] = None
    identity_providers: List[str] = field(default_factory=list)


def sanitize_agent_name(name: str) -> str:
    """
    Agent 이름을 AgentCore CLI 규칙에 맞게 변환

    규칙:
    - 문자로 시작해야 함
    - 문자, 숫자, 밑줄만 허용
    - 1-48자 길이

    예: "my-agent-123" -> "my_agent_123"
    """
    import re

    # 하이픈을 밑줄로 변환
    sanitized = name.replace('-', '_')

    # 허용되지 않는 문자 제거
    sanitized = re.sub(r'[^a-zA-Z0-9_]', '', sanitized)

    # 숫자로 시작하면 앞에 'agent_' 추가
    if sanitized and sanitized[0].isdigit():
        sanitized = 'agent_' + sanitized

    # 빈 문자열이면 기본값 사용
    if not sanitized:
        sanitized = 'agent'

    # 48자로 제한
    sanitized = sanitized[:48]

    return sanitized


class AgentCoreCLI:
    """
    AgentCore CLI 래퍼 클래스

    공식 AgentCore CLI를 사용하여 배포 관리:
    - configure(): agentcore.yaml 생성
    - deploy(): agentcore deploy 실행
    - status(): agentcore status 실행
    - invoke(): agentcore invoke 실행
    - destroy(): agentcore destroy 실행

    CLI가 설치되지 않은 경우 mock 모드로 동작
    """

    # CLI 경로 - venv 내에 설치된 경우를 위해 전체 경로 사용
    CLI_PATH = "/home/ec2-user/project/path/path-strands-agent/venv/bin/agentcore"

    def __init__(self, region: str = "us-west-2"):
        self.region = region
        self.cli_available = self._check_cli_installed()

    def _get_cli_command(self) -> str:
        """CLI 명령어 경로 반환"""
        # 전체 경로의 CLI가 존재하면 사용
        if os.path.exists(self.CLI_PATH):
            return self.CLI_PATH
        # 그렇지 않으면 PATH에서 찾기
        return "agentcore"

    def _check_cli_installed(self) -> bool:
        """AgentCore CLI 설치 확인"""
        try:
            cli_cmd = self._get_cli_command()
            # agentcore --help로 확인 (--version이 없음)
            result = subprocess.run(
                [cli_cmd, '--help'],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                logger.info(f"AgentCore CLI available at: {cli_cmd}")
                return True
            else:
                logger.warning("AgentCore CLI not available, using mock mode")
                return False
        except FileNotFoundError:
            logger.warning("AgentCore CLI not installed, using mock mode")
            return False
        except Exception as e:
            logger.warning(f"AgentCore CLI check failed: {e}, using mock mode")
            return False

    def configure(self, project_dir: Path, agent_name: str) -> bool:
        """
        agentcore configure 명령 실행 또는 .bedrock_agentcore.yaml 직접 생성

        Args:
            project_dir: 프로젝트 디렉토리 경로
            agent_name: Agent 이름

        Returns:
            성공 여부
        """
        # .bedrock_agentcore.yaml 파일명 (CLI가 기대하는 형식)
        config_path = project_dir / '.bedrock_agentcore.yaml'

        # CLI가 사용 가능하면 agentcore configure 명령 실행
        if self.cli_available:
            try:
                env = os.environ.copy()
                env['AWS_DEFAULT_REGION'] = self.region

                cli_cmd = self._get_cli_command()

                # agentcore configure 실행
                # 옵션: -n (name), -e (entrypoint), -dt (deployment type), -rt (runtime), -ni (non-interactive)
                # -dm (disable-memory): 메모리 없이 런타임만 배포
                # -c 플래그는 container만 지원하므로 사용하지 않음
                cmd = [
                    cli_cmd, 'configure',
                    '-n', agent_name,
                    '-e', 'main.py',
                    '-dt', 'direct_code_deploy',
                    '-rt', 'PYTHON_3_13',
                    '-dm',  # disable memory
                    '-ni',  # non-interactive
                    '-r', self.region
                ]

                logger.info(f"Running: {' '.join(cmd)} in {project_dir}")

                result = subprocess.run(
                    cmd,
                    cwd=str(project_dir),
                    capture_output=True,
                    text=True,
                    timeout=30,
                    env=env
                )

                if result.returncode == 0:
                    logger.info(f"agentcore configure succeeded")
                    # 설정 파일이 생성되었는지 확인
                    if config_path.exists():
                        logger.info(f"Config file created: {config_path}")
                        return True
                    else:
                        logger.warning(f"Config file not found after configure, creating manually")
                else:
                    logger.warning(f"agentcore configure failed: {result.stderr}, creating config manually")

            except subprocess.TimeoutExpired:
                logger.warning("agentcore configure timed out, creating config manually")
            except Exception as e:
                logger.warning(f"agentcore configure error: {e}, creating config manually")

        # CLI가 없거나 실패한 경우 수동으로 .bedrock_agentcore.yaml 생성
        # CLI가 기대하는 형식에 맞춰 생성 (메모리 없이 런타임만)
        config = {
            'default_agent': agent_name,
            'agents': {
                agent_name: {
                    'name': agent_name,
                    'language': 'python',
                    'entrypoint': 'main.py',
                    'deployment_type': 'direct_code_deploy',
                    'runtime_type': 'PYTHON_3_13',
                    'platform': 'linux/arm64',
                    'source_path': str(project_dir),
                    'aws': {
                        'execution_role': None,
                        'execution_role_auto_create': True,
                        'region': self.region,
                        's3_path': None,
                        's3_auto_create': True,
                        'network_configuration': {
                            'network_mode': 'PUBLIC'
                        },
                        'protocol_configuration': {
                            'server_protocol': 'HTTP'
                        },
                        'observability': {
                            'enabled': True
                        }
                    },
                    'memory': None  # 메모리 비활성화
                }
            }
        }

        try:
            with open(config_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False, sort_keys=False)

            logger.info(f"Created .bedrock_agentcore.yaml at {config_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to create .bedrock_agentcore.yaml: {e}")
            return False

    def deploy(self, project_dir: Path, agent_name: str = None) -> Dict[str, Any]:
        """
        agentcore deploy 실행

        Args:
            project_dir: 프로젝트 디렉토리 경로 (agentcore.yaml 포함)
            agent_name: Agent 이름

        Returns:
            배포 결과 (runtime_id, runtime_arn, endpoint_url, status)
        """
        logger.info(f"Running agentcore deploy in {project_dir}")

        # Mock 모드
        if not self.cli_available:
            runtime_id = f"runtime-mock-{int(time.time())}"
            runtime_arn = f"arn:aws:bedrock-agentcore:{self.region}:123456789012:runtime/{runtime_id}"
            endpoint_url = f"https://{runtime_id}.agentcore.{self.region}.amazonaws.com"

            logger.info(f"[Mock] Deploy initiated: {runtime_id}")

            return {
                "runtime_id": runtime_id,
                "runtime_arn": runtime_arn,
                "endpoint_url": endpoint_url,
                "status": "CREATING",
                "agent_name": agent_name
            }

        try:
            # agentcore deploy는 프로젝트 디렉토리에서 실행
            env = os.environ.copy()
            env['AWS_DEFAULT_REGION'] = self.region

            cli_cmd = self._get_cli_command()
            # deploy는 -r 옵션이 없음, AWS_DEFAULT_REGION 환경변수 사용
            cmd = [cli_cmd, 'deploy']
            if agent_name:
                cmd.extend(['-a', agent_name])

            result = subprocess.run(
                cmd,
                cwd=str(project_dir),
                capture_output=True,
                text=True,
                timeout=600,  # 10분 타임아웃
                env=env
            )

            if result.returncode != 0:
                error_msg = result.stderr or result.stdout or "Unknown error"
                logger.error(f"agentcore deploy failed: {error_msg}")
                raise RuntimeError(f"Deployment failed: {error_msg}")

            # CLI 출력에서 runtime_id, endpoint_url 파싱
            output = result.stdout + result.stderr  # 둘 다 확인
            logger.info(f"Deploy output: {output}")

            # 출력 파싱
            runtime_id = self._parse_runtime_id(output)
            runtime_arn = self._parse_runtime_arn(output)
            endpoint_url = self._parse_endpoint_url(output)

            return {
                "runtime_id": runtime_id,
                "runtime_arn": runtime_arn,
                "endpoint_url": endpoint_url,
                "status": "CREATING",
                "agent_name": agent_name
            }

        except subprocess.TimeoutExpired:
            raise RuntimeError("Deployment timed out after 10 minutes")
        except Exception as e:
            logger.error(f"Deploy failed: {e}")
            raise

    def status(self, agent_name: str, project_dir: Optional[Path] = None) -> Dict[str, Any]:
        """
        agentcore status 실행

        Args:
            agent_name: Agent 이름
            project_dir: 프로젝트 디렉토리 (.bedrock_agentcore.yaml 포함)

        Returns:
            상태 정보 (status, endpoint_url 등)
        """
        logger.info(f"Checking status for agent: {agent_name}")

        # Mock 모드 - 즉시 READY 반환
        if not self.cli_available:
            endpoint_url = f"https://{agent_name}.agentcore.{self.region}.amazonaws.com"
            logger.info(f"[Mock] Status: READY for {agent_name}")
            return {
                "status": "READY",
                "endpoint_url": endpoint_url,
                "error": None
            }

        try:
            env = os.environ.copy()
            env['AWS_DEFAULT_REGION'] = self.region

            cli_cmd = self._get_cli_command()
            # status는 -r 옵션이 없음, AWS_DEFAULT_REGION 환경변수 사용
            # 프로젝트 디렉토리에서 실행해야 .bedrock_agentcore.yaml을 찾을 수 있음
            result = subprocess.run(
                [cli_cmd, 'status', '-a', agent_name, '-v'],
                capture_output=True,
                text=True,
                timeout=30,
                env=env,
                cwd=str(project_dir) if project_dir else None
            )

            output = result.stdout + result.stderr
            logger.info(f"Status output: {output}")

            # agentcore status가 실패해도 출력에서 상태 파싱 시도
            status = self._parse_status(output)
            endpoint_url = self._parse_endpoint_url(output)
            error = self._parse_error(output) if status == "FAILED" else None

            return {
                "status": status,
                "endpoint_url": endpoint_url,
                "error": error
            }

        except subprocess.TimeoutExpired:
            raise RuntimeError("Status check timed out")
        except Exception as e:
            logger.error(f"Status check failed: {e}")
            raise

    def invoke(self, agent_name: str, prompt: str, session_id: Optional[str] = None, project_dir: Optional[Path] = None) -> Dict[str, Any]:
        """
        agentcore invoke 실행

        Args:
            agent_name: Agent 이름
            prompt: 프롬프트
            session_id: 세션 ID (선택)
            project_dir: 프로젝트 디렉토리 (.bedrock_agentcore.yaml 포함)

        Returns:
            응답 데이터
        """
        logger.info(f"Invoking agent: {agent_name}")

        # Mock 모드
        if not self.cli_available:
            logger.info(f"[Mock] Invoke: {agent_name}")
            return {
                "response": f"[Mock Response] Agent received: '{prompt[:50]}...' - This is a simulated response from AgentCore CLI mock mode.",
                "session_id": session_id or f"session-{int(time.time())}",
                "metadata": {
                    "latency_ms": 500,
                    "tokens_used": 150,
                    "mock": True
                }
            }

        # payload는 JSON 문자열로 전달
        payload = {"prompt": prompt}
        if session_id:
            payload["session_id"] = session_id

        try:
            env = os.environ.copy()
            env['AWS_DEFAULT_REGION'] = self.region

            cli_cmd = self._get_cli_command()
            # invoke는 -r 옵션이 없음, AWS_DEFAULT_REGION 환경변수 사용
            # 프로젝트 디렉토리에서 실행해야 .bedrock_agentcore.yaml을 찾을 수 있음
            cwd = str(project_dir) if project_dir and project_dir.exists() else None

            cmd = [cli_cmd, 'invoke', json.dumps(payload), '-a', agent_name]
            if session_id:
                cmd.extend(['-s', session_id])

            logger.info(f"Running: {' '.join(cmd)} in {cwd or 'current directory'}")

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120,  # 2분 타임아웃
                env=env,
                cwd=cwd
            )

            if result.returncode != 0:
                error_msg = result.stderr or result.stdout or "Unknown error"
                logger.error(f"agentcore invoke failed: {error_msg}")
                raise RuntimeError(f"Invocation failed: {error_msg}")

            # 응답 파싱 (JSON 형식 예상)
            try:
                response_data = json.loads(result.stdout)
                return {
                    "response": response_data.get("response", response_data.get("output", result.stdout)),
                    "session_id": response_data.get("session_id", session_id),
                    "metadata": response_data.get("metadata", {})
                }
            except json.JSONDecodeError:
                # JSON이 아닌 경우 텍스트로 반환
                return {
                    "response": result.stdout.strip(),
                    "session_id": session_id,
                    "metadata": {}
                }

        except subprocess.TimeoutExpired:
            raise RuntimeError("Invocation timed out after 2 minutes")
        except Exception as e:
            logger.error(f"Invoke failed: {e}")
            raise

    def destroy(self, agent_name: str, project_dir: Optional[Path] = None) -> bool:
        """
        agentcore destroy 실행

        Args:
            agent_name: Agent 이름
            project_dir: 프로젝트 디렉토리 (.bedrock_agentcore.yaml 포함, 선택적)

        Returns:
            성공 여부
        """
        logger.info(f"Destroying agent: {agent_name}")

        # Mock 모드
        if not self.cli_available:
            logger.info(f"[Mock] Destroy: {agent_name}")
            return True

        try:
            env = os.environ.copy()
            env['AWS_DEFAULT_REGION'] = self.region

            cli_cmd = self._get_cli_command()
            # destroy는 -r 옵션이 없음, AWS_DEFAULT_REGION 환경변수 사용
            # 프로젝트 디렉토리가 있으면 해당 위치에서 실행
            cwd = str(project_dir) if project_dir and project_dir.exists() else None

            result = subprocess.run(
                [cli_cmd, 'destroy', '-a', agent_name, '--force'],
                capture_output=True,
                text=True,
                timeout=120,
                env=env,
                cwd=cwd
            )

            output = result.stdout + result.stderr
            logger.info(f"Destroy output: {output}")

            if result.returncode != 0:
                error_msg = result.stderr or result.stdout or "Unknown error"
                logger.error(f"agentcore destroy failed: {error_msg}")
                # 에러 내용에 따라 성공으로 처리할 수 있는 경우
                # (이미 삭제된 경우, 리소스를 찾을 수 없는 경우 등)
                if "not found" in error_msg.lower() or "does not exist" in error_msg.lower():
                    logger.info(f"Agent {agent_name} already deleted or not found")
                    return True
                return False

            logger.info(f"Agent destroyed: {agent_name}")
            return True

        except subprocess.TimeoutExpired:
            logger.error("Destroy timed out")
            return False
        except Exception as e:
            logger.error(f"Destroy failed: {e}")
            return False

    # 파싱 헬퍼 메서드들
    def _parse_runtime_id(self, output: str) -> str:
        """CLI 출력에서 Runtime ID 추출"""
        patterns = [
            r'Runtime ID:\s*(\S+)',
            r'runtime_id["\']?\s*[:=]\s*["\']?(\S+)',
            r'agentRuntimeId["\']?\s*[:=]\s*["\']?(\S+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                return match.group(1).strip('"\'')

        # JSON 형식 시도
        try:
            data = json.loads(output)
            return data.get('runtime_id') or data.get('agentRuntimeId', '')
        except json.JSONDecodeError:
            pass

        logger.warning(f"Could not parse runtime_id from output: {output[:200]}")
        return f"runtime-{int(time.time())}"  # Fallback

    def _parse_runtime_arn(self, output: str) -> str:
        """CLI 출력에서 Runtime ARN 추출"""
        patterns = [
            r'Runtime ARN:\s*(arn:aws:bedrock-agentcore:\S+)',
            r'runtime_arn["\']?\s*[:=]\s*["\']?(arn:aws:bedrock-agentcore:\S+)',
            r'agentRuntimeArn["\']?\s*[:=]\s*["\']?(arn:aws:bedrock-agentcore:\S+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                return match.group(1).strip('"\'')

        # JSON 형식 시도
        try:
            data = json.loads(output)
            return data.get('runtime_arn') or data.get('agentRuntimeArn', '')
        except json.JSONDecodeError:
            pass

        return ""

    def _parse_endpoint_url(self, output: str) -> str:
        """CLI 출력에서 Endpoint URL 추출"""
        patterns = [
            r'Endpoint:\s*(https://\S+)',
            r'endpoint_url["\']?\s*[:=]\s*["\']?(https://\S+)',
            r'endpointUrl["\']?\s*[:=]\s*["\']?(https://\S+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                return match.group(1).strip('"\'')

        # JSON 형식 시도
        try:
            data = json.loads(output)
            return data.get('endpoint_url') or data.get('endpointUrl', '')
        except json.JSONDecodeError:
            pass

        return ""

    def _parse_status(self, output: str) -> str:
        """CLI 출력에서 상태 추출"""
        # JSON 형식 먼저 시도 (agentcore status 출력)
        try:
            data = json.loads(output)
            # 중첩된 JSON 구조: agent.status 또는 endpoint.status
            status = None
            if isinstance(data, dict):
                if 'agent' in data and isinstance(data['agent'], dict):
                    status = data['agent'].get('status')
                elif 'endpoint' in data and isinstance(data['endpoint'], dict):
                    status = data['endpoint'].get('status')
                elif 'status' in data:
                    status = data.get('status')

            if status:
                status = status.upper()
                if status in ['READY', 'ACTIVE', 'RUNNING']:
                    return 'READY'
                elif status in ['CREATING', 'PENDING', 'STARTING']:
                    return 'CREATING'
                elif status in ['FAILED', 'ERROR']:
                    return 'FAILED'
                return status
        except json.JSONDecodeError:
            pass

        # 정규식 패턴 시도 (텍스트 출력)
        patterns = [
            r'"status":\s*"(\w+)"',  # JSON 스타일
            r'Status:\s*(\w+)',
            r'status["\']?\s*[:=]\s*["\']?(\w+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                status = match.group(1).upper()
                if status in ['READY', 'ACTIVE', 'RUNNING']:
                    return 'READY'
                elif status in ['CREATING', 'PENDING', 'STARTING']:
                    return 'CREATING'
                elif status in ['FAILED', 'ERROR']:
                    return 'FAILED'
                return status

        return "UNKNOWN"

    def _parse_error(self, output: str) -> Optional[str]:
        """CLI 출력에서 에러 메시지 추출"""
        patterns = [
            r'Error:\s*(.+)',
            r'error["\']?\s*[:=]\s*["\']?(.+)',
        ]
        for pattern in patterns:
            match = re.search(pattern, output, re.IGNORECASE)
            if match:
                return match.group(1).strip('"\'')

        return None


# AgentCore CLI 싱글톤 인스턴스
agentcore_cli = AgentCoreCLI()


class DeploymentService:
    """AgentCore 배포 서비스"""

    def __init__(self, region: str = "us-west-2"):
        self.region = region

        if HAS_BOTO3:
            self.sts_client = boto3.client('sts', region_name=region)
            self.s3_client = boto3.client('s3', region_name=region)
            self.dynamodb = boto3.resource('dynamodb', region_name=region)
            self.deployments_table = self.dynamodb.Table('path-agent-deployments')

            # AgentCore Control Plane 클라이언트
            try:
                self.agentcore_client = boto3.client('bedrock-agentcore-control', region_name=region)
                logger.info("AgentCore client initialized")
            except Exception as e:
                logger.warning(f"AgentCore client not available: {e}")
                self.agentcore_client = None
        else:
            self.sts_client = None
            self.s3_client = None
            self.dynamodb = None
            self.deployments_table = None
            self.agentcore_client = None

        logger.info(f"DeploymentService initialized (region={region})")
        logger.info(f"  S3: {'available' if self.s3_client else 'not available'}")
        logger.info(f"  AgentCore: {'available' if self.agentcore_client else 'not available'}")
        logger.info(f"  DynamoDB: {'available' if self.dynamodb else 'not available'}")

    def get_account_id(self) -> str:
        """AWS Account ID 조회"""
        if not self.sts_client:
            return "123456789012"  # Mock
        try:
            return self.sts_client.get_caller_identity()['Account']
        except Exception as e:
            logger.error(f"Failed to get account ID: {e}")
            return "123456789012"

    def get_s3_bucket_name(self) -> str:
        """
        AgentCore S3 버킷 이름 반환

        환경변수 AGENTCORE_S3_BUCKET이 설정되어 있으면 해당 값 사용,
        없으면 기본 규칙 (bedrock-agentcore-code-{account}-{region}) 사용
        """
        custom_bucket = os.environ.get('AGENTCORE_S3_BUCKET')
        if custom_bucket:
            logger.info(f"Using custom S3 bucket: {custom_bucket}")
            return custom_bucket

        account_id = self.get_account_id()
        return f"bedrock-agentcore-code-{account_id}-{self.region}"

    def get_runtime_role_arn(self) -> str:
        """
        AgentCore Runtime IAM Role ARN 반환

        환경변수 AGENTCORE_ROLE_ARN이 설정되어 있으면 해당 값 사용,
        없으면 기본 규칙 사용
        """
        custom_role = os.environ.get('AGENTCORE_ROLE_ARN')
        if custom_role:
            logger.info(f"Using custom IAM role: {custom_role}")
            return custom_role

        account_id = self.get_account_id()
        return f"arn:aws:iam::{account_id}:role/AmazonBedrockAgentCoreSDKRuntime-{self.region}"

    def save_generated_files(self, code_path: Path, files: Dict[str, str]) -> None:
        """생성된 코드 파일을 디렉토리에 저장"""
        code_path.mkdir(parents=True, exist_ok=True)

        for filename, content in files.items():
            file_path = code_path / filename
            file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(file_path, 'w') as f:
                f.write(content)

        logger.info(f"Saved {len(files)} files to {code_path}")

    def build_deployment_package(
        self,
        code_path: Path,
        agent_name: str,
        progress_callback: Optional[Callable] = None
    ) -> Path:
        """
        uv를 사용해 ARM64 배포 패키지 생성

        1. 코드 파일들을 임시 디렉토리에 복사
        2. uv pip install --python-platform aarch64-manylinux2014 실행
        3. ZIP 파일 생성

        Returns: ZIP 파일 경로
        """
        logger.info(f"Building deployment package for {agent_name}")

        # 임시 빌드 디렉토리 생성
        build_dir = Path(tempfile.mkdtemp(prefix=f"agentcore-build-{agent_name}-"))
        package_dir = build_dir / "package"
        package_dir.mkdir()

        try:
            # 1. 코드 파일들 복사
            logger.info(f"Copying source files from {code_path}")
            for item in code_path.iterdir():
                if item.is_file():
                    shutil.copy2(item, package_dir / item.name)
                elif item.is_dir() and item.name not in ['__pycache__', '.git', 'venv']:
                    shutil.copytree(item, package_dir / item.name)

            if progress_callback:
                asyncio.create_task(progress_callback(15, "소스 파일 복사 완료"))

            # 2. requirements.txt 확인
            requirements_file = package_dir / "requirements.txt"
            if not requirements_file.exists():
                # 기본 requirements 생성
                requirements_file.write_text("strands-agents\nstrands-agents-tools\nboto3\n")
                logger.info("Created default requirements.txt")

            # 3. uv pip install로 의존성 설치 (ARM64)
            logger.info("Installing dependencies with uv (ARM64 target)")
            deps_dir = package_dir / "python_deps"

            uv_cmd = [
                "uv", "pip", "install",
                "--python-platform", "aarch64-manylinux2014",
                "--python-version", "3.13",
                "--target", str(deps_dir),
                "--only-binary", ":all:",
                "-r", str(requirements_file)
            ]

            logger.info(f"Running: {' '.join(uv_cmd)}")

            result = subprocess.run(
                uv_cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5분 타임아웃
            )

            if result.returncode != 0:
                logger.error(f"uv pip install failed: {result.stderr}")
                raise RuntimeError(f"uv pip install failed: {result.stderr}")

            logger.info("Dependencies installed successfully")

            if progress_callback:
                asyncio.create_task(progress_callback(30, "의존성 설치 완료"))

            # 4. ZIP 파일 생성
            zip_path = build_dir / f"{agent_name}-deployment.zip"
            logger.info(f"Creating deployment package: {zip_path}")

            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                # 의존성 패키지 추가 (deps 폴더 내용을 루트에)
                if deps_dir.exists():
                    for file_path in deps_dir.rglob('*'):
                        if file_path.is_file():
                            arcname = str(file_path.relative_to(deps_dir))
                            # 파일 권한 설정
                            info = zipfile.ZipInfo(arcname)
                            if file_path.suffix in ['.so', '.py'] or 'bin/' in arcname:
                                info.external_attr = (stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH) << 16  # 755
                            else:
                                info.external_attr = (stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH) << 16  # 644
                            with open(file_path, 'rb') as f:
                                zf.writestr(info, f.read())

                # 소스 코드 추가 (main.py 등)
                for file_path in package_dir.iterdir():
                    if file_path.is_file():
                        arcname = file_path.name
                        info = zipfile.ZipInfo(arcname)
                        info.external_attr = (stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH) << 16  # 644
                        with open(file_path, 'rb') as f:
                            zf.writestr(info, f.read())
                    elif file_path.is_dir() and file_path.name != 'python_deps':
                        for sub_file in file_path.rglob('*'):
                            if sub_file.is_file():
                                arcname = str(sub_file.relative_to(package_dir))
                                info = zipfile.ZipInfo(arcname)
                                info.external_attr = (stat.S_IRUSR | stat.S_IWUSR | stat.S_IRGRP | stat.S_IROTH) << 16
                                with open(sub_file, 'rb') as f:
                                    zf.writestr(info, f.read())

            # ZIP 크기 확인
            zip_size = zip_path.stat().st_size
            zip_size_mb = zip_size / (1024 * 1024)
            logger.info(f"Deployment package created: {zip_size_mb:.2f} MB")

            if zip_size_mb > 250:
                raise RuntimeError(f"Deployment package too large: {zip_size_mb:.2f} MB (max 250 MB)")

            if progress_callback:
                asyncio.create_task(progress_callback(40, f"패키지 생성 완료 ({zip_size_mb:.1f} MB)"))

            return zip_path

        except Exception as e:
            logger.error(f"Failed to build deployment package: {e}")
            # 빌드 디렉토리 정리
            shutil.rmtree(build_dir, ignore_errors=True)
            raise

    def upload_to_s3(
        self,
        zip_path: Path,
        agent_name: str,
        version: int = 1,
        progress_callback: Optional[Callable] = None
    ) -> str:
        """
        배포 패키지를 AgentCore S3 버킷에 업로드

        Returns: S3 URI
        """
        bucket_name = self.get_s3_bucket_name()
        s3_key = f"{agent_name}/v{version}/deployment_package.zip"

        logger.info(f"Uploading to s3://{bucket_name}/{s3_key}")

        if not self.s3_client:
            # Mock 응답
            s3_uri = f"s3://{bucket_name}/{s3_key}"
            logger.info(f"[Mock] S3 upload: {s3_uri}")
            return s3_uri

        try:
            account_id = self.get_account_id()

            # 파일 업로드
            self.s3_client.upload_file(
                str(zip_path),
                bucket_name,
                s3_key,
                ExtraArgs={'ExpectedBucketOwner': account_id}
            )

            s3_uri = f"s3://{bucket_name}/{s3_key}"
            logger.info(f"Uploaded to S3: {s3_uri}")

            if progress_callback:
                asyncio.create_task(progress_callback(55, "S3 업로드 완료"))

            return s3_uri

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchBucket':
                raise RuntimeError(f"S3 bucket not found: {bucket_name}. Ensure AgentCore is set up in this region.")
            raise

    def create_runtime(
        self,
        agent_name: str,
        s3_bucket: str,
        s3_key: str,
        progress_callback: Optional[Callable] = None,
        protocol_type: str = "HTTP"  # HTTP (기본값, Agent용) 또는 MCP (MCP 서버용)
    ) -> Dict[str, str]:
        """
        AgentCore Runtime 생성

        Args:
            agent_name: Agent/MCP 서버 이름
            s3_bucket: S3 버킷 이름
            s3_key: S3 키 (ZIP 파일 경로)
            progress_callback: 진행률 콜백
            protocol_type: 프로토콜 유형 - "HTTP" (Agent용) 또는 "MCP" (MCP 서버용)

        Returns: runtime_id, runtime_arn, status
        """
        logger.info(f"Creating AgentCore Runtime: {agent_name} (protocol={protocol_type})")

        if not self.agentcore_client:
            # Mock 응답
            account_id = self.get_account_id()
            runtime_id = f"runtime-{agent_name}-{int(time.time())}"
            runtime_arn = f"arn:aws:bedrock-agentcore:{self.region}:{account_id}:runtime/{runtime_id}"
            endpoint_url = f"https://{runtime_id}.agentcore.{self.region}.amazonaws.com"

            logger.info(f"[Mock] Runtime created: {runtime_arn}")

            return {
                "runtime_id": runtime_id,
                "runtime_arn": runtime_arn,
                "endpoint_url": endpoint_url,
                "status": "CREATING"
            }

        try:
            role_arn = self.get_runtime_role_arn()

            # s3_key 예: agent3/v5/deployment_package.zip
            # AWS 문서에 따르면 prefix는 ZIP 파일 경로 전체 (파일명 포함)
            logger.info(f"Creating runtime with S3: bucket={s3_bucket}, prefix={s3_key}")

            # 프로토콜 설정 - MCP 서버는 MCP 프로토콜 사용
            protocol_config = {'serverProtocol': protocol_type}

            response = self.agentcore_client.create_agent_runtime(
                agentRuntimeName=agent_name,
                agentRuntimeArtifact={
                    'codeConfiguration': {
                        'code': {
                            's3': {
                                'bucket': s3_bucket,
                                'prefix': s3_key  # ZIP 파일 전체 경로 (파일명 포함)
                            }
                        },
                        'runtime': 'PYTHON_3_13',
                        'entryPoint': ['main.py']  # 리스트로 전달
                    }
                },
                networkConfiguration={'networkMode': 'PUBLIC'},
                protocolConfiguration=protocol_config,
                roleArn=role_arn
            )

            result = {
                "runtime_id": response['agentRuntimeId'],
                "runtime_arn": response['agentRuntimeArn'],
                "endpoint_url": response.get('endpointUrl'),
                "status": response.get('status', 'CREATING')
            }

            logger.info(f"Runtime created: {result['runtime_arn']}")

            if progress_callback:
                asyncio.create_task(progress_callback(70, "Runtime 생성 요청 완료"))

            return result

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_msg = e.response['Error']['Message']
            logger.error(f"Failed to create runtime: {error_code} - {error_msg}")
            raise RuntimeError(f"Failed to create runtime: {error_msg}")

    def get_runtime_status(self, runtime_id: str) -> Dict[str, Any]:
        """
        Runtime 생성 상태 확인

        Returns: status (CREATING, READY, FAILED), endpoint_url
        """
        if not self.agentcore_client:
            # Mock - 항상 READY
            return {
                "status": "READY",
                "endpoint_url": f"https://{runtime_id}.agentcore.{self.region}.amazonaws.com"
            }

        try:
            response = self.agentcore_client.get_agent_runtime(
                agentRuntimeId=runtime_id
            )

            return {
                "status": response.get('status', 'UNKNOWN'),
                "endpoint_url": response.get('endpointUrl'),
                "runtime_arn": response.get('agentRuntimeArn'),
                "last_updated": response.get('lastUpdatedAt')
            }

        except ClientError as e:
            logger.error(f"Failed to get runtime status: {e}")
            raise

    async def wait_for_runtime_ready(
        self,
        runtime_id: str,
        timeout: int = 300,
        poll_interval: int = 10,
        progress_callback: Optional[Callable] = None
    ) -> Dict[str, Any]:
        """
        Runtime이 READY 상태가 될 때까지 대기

        Args:
            runtime_id: Runtime ID
            timeout: 최대 대기 시간 (초)
            poll_interval: 폴링 간격 (초)
            progress_callback: 진행률 콜백

        Returns: 최종 상태 정보
        """
        start_time = time.time()
        base_progress = 70
        max_progress = 95

        while True:
            elapsed = time.time() - start_time

            if elapsed > timeout:
                raise TimeoutError(f"Runtime failed to become ready within {timeout} seconds")

            status_info = self.get_runtime_status(runtime_id)
            status = status_info.get('status', 'UNKNOWN')

            logger.info(f"Runtime status: {status} (elapsed: {elapsed:.0f}s)")

            if status == 'READY':
                if progress_callback:
                    await progress_callback(95, "Runtime 준비 완료")
                return status_info

            if status == 'FAILED':
                raise RuntimeError(f"Runtime creation failed: {status_info}")

            # 진행률 업데이트
            if progress_callback:
                progress = base_progress + int((elapsed / timeout) * (max_progress - base_progress))
                await progress_callback(min(progress, max_progress - 1), f"Runtime 시작 중... ({int(elapsed)}s)")

            await asyncio.sleep(poll_interval)

    def update_runtime(
        self,
        runtime_id: str,
        s3_bucket: str,
        s3_key: str
    ) -> Dict[str, Any]:
        """
        Runtime 업데이트 (새 코드 배포)
        """
        logger.info(f"Updating runtime: {runtime_id}")

        if not self.agentcore_client:
            # Mock
            logger.info(f"[Mock] Runtime updated: {runtime_id}")
            return {"status": "UPDATING", "runtime_id": runtime_id}

        try:
            role_arn = self.get_runtime_role_arn()

            response = self.agentcore_client.update_agent_runtime(
                agentRuntimeId=runtime_id,
                agentRuntimeArtifact={
                    'codeConfiguration': {
                        'code': {
                            's3': {
                                'bucket': s3_bucket,
                                'objectKey': s3_key  # ZIP 파일 전체 경로
                            }
                        },
                        'runtime': 'PYTHON_3_13',
                        'entryPoint': 'main.py'
                    }
                },
                networkConfiguration={'networkMode': 'PUBLIC'},
                roleArn=role_arn
            )

            logger.info(f"Runtime update initiated: {runtime_id}")
            return response

        except ClientError as e:
            logger.error(f"Failed to update runtime: {e}")
            raise

    def delete_runtime(self, runtime_id: str, agent_name: Optional[str] = None) -> bool:
        """
        AgentCore Runtime 삭제 (boto3 API 사용)

        Args:
            runtime_id: Runtime ID (예: agent-yGB8OK8v1F)
            agent_name: Agent 이름 (로깅용, 선택적)

        Returns:
            성공 여부
        """
        logger.info(f"Deleting runtime: {runtime_id} (agent: {agent_name})")

        if not self.agentcore_client:
            # Mock 모드
            logger.info(f"[Mock] Runtime deleted: {runtime_id}")
            return True

        try:
            self.agentcore_client.delete_agent_runtime(
                agentRuntimeId=runtime_id
            )
            logger.info(f"Runtime deleted successfully: {runtime_id}")
            return True

        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))

            # 이미 삭제된 경우나 찾을 수 없는 경우는 성공으로 처리
            if error_code in ['ResourceNotFoundException', 'ValidationException']:
                logger.info(f"Runtime already deleted or not found: {runtime_id}")
                return True

            logger.error(f"Failed to delete runtime: {error_code} - {error_message}")
            return False

        except Exception as e:
            logger.error(f"Delete runtime failed: {e}")
            return False

    def _analyze_required_services(
        self,
        integration_details: List[Dict]
    ) -> Dict[str, Any]:
        """
        통합 목록을 분석하여 필요한 AgentCore 서비스 결정

        Args:
            integration_details: 등록된 통합 목록

        Returns:
            {
                "gateway_needed": bool,
                "identity_needed": bool,
                "api_integrations": [...],
                "mcp_integrations": [...],
                "auth_configs": [...]
            }
        """
        result = {
            "gateway_needed": False,
            "identity_needed": False,
            "api_integrations": [],
            "mcp_integrations": [],
            "auth_configs": []
        }

        if not integration_details:
            return result

        for integration in integration_details:
            int_type = integration.get('type', '')
            config = integration.get('config', {})

            if int_type == 'api':
                result["gateway_needed"] = True
                result["api_integrations"].append(integration)

                auth_type = config.get('authType', 'none')
                if auth_type in ['api-key', 'bearer', 'oauth2']:
                    result["identity_needed"] = True
                    result["auth_configs"].append({
                        "integration": integration,
                        "auth_type": auth_type
                    })

            elif int_type == 'mcp':
                result["gateway_needed"] = True
                result["mcp_integrations"].append(integration)

        return result

    async def _create_gateway_for_deployment(
        self,
        deployment_id: str,
        agent_name: str,
        integration_details: List[Dict],
        progress_callback: Optional[Callable] = None
    ) -> Optional[Dict]:
        """
        배포 시 Gateway 및 Identity Provider 생성

        Args:
            deployment_id: 배포 ID
            agent_name: Agent 이름
            integration_details: 통합 목록
            progress_callback: 진행률 콜백

        Returns:
            {
                "gateway_id": str,
                "gateway_url": str,
                "identity_providers": [str, ...]
            } or None if not needed
        """
        services = self._analyze_required_services(integration_details)

        if not services["gateway_needed"]:
            logger.info("No Gateway needed for this deployment")
            return None

        if progress_callback:
            await progress_callback(35, "Gateway 생성 중...")

        identity_providers = []

        # 1. Identity Providers 생성 (인증이 필요한 API가 있는 경우)
        if services["identity_needed"]:
            if progress_callback:
                await progress_callback(32, "Credential Provider 생성 중...")

            for auth_config in services["auth_configs"]:
                integration = auth_config["integration"]
                try:
                    provider_arn = identity_manager.create_credential_provider_for_integration(
                        integration, agent_name
                    )
                    if provider_arn:
                        identity_providers.append(provider_arn)
                        logger.info(f"Created credential provider: {provider_arn}")
                except Exception as e:
                    logger.warning(f"Failed to create credential provider: {e}")

        # 2. Gateway 생성
        try:
            gateway_result = gateway_manager.create_gateway(
                name=f"{agent_name}-gateway",
                role_arn=self.get_runtime_role_arn(),
                enable_semantic_search=True
            )

            # 3. API Target 추가
            for api_int in services["api_integrations"]:
                config = api_int.get('config', {})
                openapi_spec = config.get('openApiSpec')
                name = api_int.get('name', 'api')

                if openapi_spec:
                    try:
                        # OpenAPI 스키마가 dict이면 S3에 업로드
                        if isinstance(openapi_spec, dict):
                            s3_uri = gateway_manager.upload_openapi_to_s3(
                                openapi_spec, agent_name, name
                            )
                        else:
                            s3_uri = openapi_spec

                        gateway_manager.add_openapi_target(
                            gateway_id=gateway_result.gateway_id,
                            name=name,
                            openapi_s3_uri=s3_uri,
                            bucket_owner_account_id=self.get_account_id()
                        )
                        logger.info(f"Added OpenAPI target: {name}")
                    except Exception as e:
                        logger.warning(f"Failed to add OpenAPI target: {e}")

            # 4. MCP Target 추가
            for mcp_int in services["mcp_integrations"]:
                config = mcp_int.get('config', {})
                server_url = config.get('serverUrl')
                name = mcp_int.get('name', 'mcp')

                if server_url:
                    try:
                        gateway_manager.add_mcp_server_target(
                            gateway_id=gateway_result.gateway_id,
                            name=name,
                            mcp_server_url=server_url
                        )
                        logger.info(f"Added MCP server target: {name}")
                    except Exception as e:
                        logger.warning(f"Failed to add MCP target: {e}")

            if progress_callback:
                await progress_callback(45, "Gateway 생성 완료")

            return {
                "gateway_id": gateway_result.gateway_id,
                "gateway_url": gateway_result.gateway_url,
                "identity_providers": identity_providers,
                "cognito_config": gateway_result.cognito_config
            }

        except Exception as e:
            logger.error(f"Failed to create gateway: {e}")
            return None

    async def invoke_runtime(
        self,
        endpoint_url: str,
        prompt: str,
        session_id: Optional[str] = None,
        agent_name: Optional[str] = None,
        deployment_id: Optional[str] = None,
        runtime_id: Optional[str] = None,
        runtime_arn: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        AgentCore Runtime 호출 (boto3 invoke_agent_runtime API 사용)

        Args:
            endpoint_url: 레거시 - 사용하지 않음
            prompt: 사용자 입력
            session_id: 세션 ID
            agent_name: Agent 이름
            deployment_id: 배포 ID
            runtime_id: Runtime ID (ARN 생성에 사용)
            runtime_arn: Runtime ARN (직접 지정 시)
        """
        logger.info(f"Invoking runtime: runtime_id={runtime_id}, runtime_arn={runtime_arn}")

        # Mock 응답
        if not runtime_id and not runtime_arn:
            if not endpoint_url or 'mock' in str(endpoint_url).lower():
                await asyncio.sleep(0.5)
                return {
                    "response": f"[Mock Response] Agent received: '{prompt[:50]}...' - This is a simulated response.",
                    "session_id": session_id or f"session-{int(time.time())}",
                    "metadata": {
                        "latency_ms": 500,
                        "tokens_used": 150
                    }
                }

        if not HAS_BOTO3:
            raise RuntimeError("boto3 not installed")

        try:
            start_time = time.time()

            # Runtime ARN 구성 (없으면 runtime_id로 생성)
            if not runtime_arn and runtime_id:
                # Account ID 조회
                sts_client = boto3.client('sts', region_name=self.region)
                account_id = sts_client.get_caller_identity()['Account']
                runtime_arn = f"arn:aws:bedrock-agentcore:{self.region}:{account_id}:runtime/{runtime_id}"

            if not runtime_arn:
                raise RuntimeError("runtime_arn 또는 runtime_id가 필요합니다")

            logger.info(f"Using Runtime ARN: {runtime_arn}")

            # boto3 클라이언트 생성
            client = boto3.client('bedrock-agentcore', region_name=self.region)

            # 페이로드 생성
            payload = json.dumps({"prompt": prompt}).encode('utf-8')

            # 세션 ID 생성 (최소 33자 필요)
            import uuid
            if not session_id or len(session_id) < 33:
                session_id = str(uuid.uuid4()) + "-" + str(uuid.uuid4())[:8]  # 45자

            # invoke_agent_runtime 호출
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.invoke_agent_runtime(
                    agentRuntimeArn=runtime_arn,
                    payload=payload,
                    contentType='application/json',
                    accept='application/json',
                    runtimeSessionId=session_id
                )
            )

            latency_ms = int((time.time() - start_time) * 1000)

            # 스트리밍 응답 읽기
            response_body = response.get('response')
            if response_body:
                response_text = response_body.read().decode('utf-8')
            else:
                response_text = ""

            logger.info(f"Runtime response received: {len(response_text)} chars")

            # JSON 파싱
            try:
                data = json.loads(response_text) if response_text else {}
            except json.JSONDecodeError:
                data = {"response": response_text}

            # 응답 추출
            response_content = (
                data.get("result") or
                data.get("response") or
                data.get("output") or
                response_text or
                str(data)
            )

            return {
                "response": response_content,
                "session_id": response.get('runtimeSessionId', session_id) or f"session-{int(time.time())}",
                "metadata": {
                    "latency_ms": latency_ms,
                    "tokens_used": data.get("usage", {}).get("total_tokens", 0),
                    "status_code": response.get('statusCode', 200)
                }
            }

        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            logger.error(f"boto3 invoke failed: {error_code} - {error_message}")
            raise RuntimeError(f"Runtime invocation failed: {error_code} - {error_message}")
        except Exception as e:
            logger.error(f"Runtime invocation failed: {e}")
            raise RuntimeError(f"Runtime invocation failed: {e}")

    async def invoke_runtime_stream(
        self,
        prompt: str,
        runtime_id: Optional[str] = None,
        runtime_arn: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        """
        AgentCore Runtime 스트리밍 호출 (SSE용)

        응답을 청크 단위로 yield합니다.

        Args:
            prompt: 사용자 입력
            runtime_id: Runtime ID
            runtime_arn: Runtime ARN
            session_id: 세션 ID

        Yields:
            dict: {"type": "chunk|done|error", "content": str, ...}
        """
        logger.info(f"Streaming invoke: runtime_id={runtime_id}")

        # Mock 응답
        if not runtime_id and not runtime_arn:
            # 시뮬레이션 스트리밍
            mock_response = f"[Mock Response] Agent received: '{prompt[:50]}...' - This is a simulated streaming response from AgentCore."
            for i in range(0, len(mock_response), 10):
                chunk = mock_response[i:i+10]
                yield {"type": "chunk", "content": chunk}
                await asyncio.sleep(0.05)
            yield {"type": "done", "session_id": f"session-mock-{int(time.time())}"}
            return

        if not HAS_BOTO3:
            yield {"type": "error", "content": "boto3 not installed"}
            return

        try:
            start_time = time.time()

            # Runtime ARN 구성
            if not runtime_arn and runtime_id:
                sts_client = boto3.client('sts', region_name=self.region)
                account_id = sts_client.get_caller_identity()['Account']
                runtime_arn = f"arn:aws:bedrock-agentcore:{self.region}:{account_id}:runtime/{runtime_id}"

            if not runtime_arn:
                yield {"type": "error", "content": "runtime_arn 또는 runtime_id가 필요합니다"}
                return

            logger.info(f"Streaming with Runtime ARN: {runtime_arn}")

            # boto3 클라이언트
            client = boto3.client('bedrock-agentcore', region_name=self.region)
            payload = json.dumps({"prompt": prompt}).encode('utf-8')

            # 세션 ID 생성 (최소 33자)
            import uuid
            if not session_id or len(session_id) < 33:
                session_id = str(uuid.uuid4()) + "-" + str(uuid.uuid4())[:8]

            # invoke_agent_runtime 호출
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: client.invoke_agent_runtime(
                    agentRuntimeArn=runtime_arn,
                    payload=payload,
                    contentType='application/json',
                    accept='application/json',
                    runtimeSessionId=session_id
                )
            )

            # 스트리밍 응답 처리
            response_body = response.get('response')
            if response_body:
                # StreamingBody를 청크 단위로 읽기
                full_response = ""
                chunk_size = 64  # 64바이트씩 읽기

                # StreamingBody 전체를 읽고 청크로 나눠서 스트리밍
                raw_data = await loop.run_in_executor(None, response_body.read)
                response_text = raw_data.decode('utf-8')

                # JSON 파싱 시도
                try:
                    data = json.loads(response_text)
                    full_response = (
                        data.get("result") or
                        data.get("response") or
                        data.get("output") or
                        response_text
                    )
                except json.JSONDecodeError:
                    full_response = response_text

                # 타이핑 효과를 위해 청크로 나눠서 전송
                # 단어 단위로 스트리밍 (더 자연스러움)
                words = full_response.split(' ')
                for i, word in enumerate(words):
                    chunk = word + (' ' if i < len(words) - 1 else '')
                    yield {"type": "chunk", "content": chunk}
                    await asyncio.sleep(0.02)  # 20ms 딜레이

            latency_ms = int((time.time() - start_time) * 1000)

            yield {
                "type": "done",
                "session_id": response.get('runtimeSessionId', session_id),
                "metadata": {
                    "latency_ms": latency_ms,
                    "status_code": response.get('statusCode', 200)
                }
            }

        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_message = e.response.get('Error', {}).get('Message', str(e))
            logger.error(f"Streaming invoke failed: {error_code} - {error_message}")
            yield {"type": "error", "content": f"{error_code}: {error_message}"}

        except Exception as e:
            logger.error(f"Streaming invoke failed: {e}")
            yield {"type": "error", "content": str(e)}

    def _store_deployment(self, deployment_info: Dict):
        """배포 정보를 DynamoDB에 저장"""
        if not self.deployments_table:
            logger.warning("DynamoDB not available, skipping storage")
            return

        try:
            self.deployments_table.put_item(Item=deployment_info)
            logger.info(f"Deployment info stored: {deployment_info['deployment_id']}")
        except Exception as e:
            logger.error(f"Failed to store deployment: {e}")
            raise

    def get_deployment(self, deployment_id: str) -> Optional[Dict]:
        """배포 정보 조회"""
        if not self.deployments_table:
            return None

        try:
            response = self.deployments_table.get_item(Key={"deployment_id": deployment_id})
            return response.get("Item")
        except Exception as e:
            logger.error(f"Failed to get deployment: {e}")
            return None

    def list_deployments(self, limit: int = 50) -> List[Dict]:
        """배포 목록 조회"""
        if not self.deployments_table:
            return []

        try:
            response = self.deployments_table.scan(Limit=limit)
            deployments = response.get("Items", [])
            deployments.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return deployments
        except Exception as e:
            logger.error(f"Failed to list deployments: {e}")
            return []

    def delete_deployment(self, deployment_id: str):
        """배포 삭제 (DynamoDB + Runtime)"""
        if not self.deployments_table:
            return

        try:
            deployment = self.get_deployment(deployment_id)
            if not deployment:
                raise ValueError(f"Deployment not found: {deployment_id}")

            # Runtime 삭제 (boto3 API 사용)
            runtime_id = deployment.get("runtime_id")
            agent_name = deployment.get("agent_name")
            if runtime_id:
                self.delete_runtime(runtime_id, agent_name)

            # DynamoDB에서 삭제
            self.deployments_table.delete_item(Key={"deployment_id": deployment_id})
            logger.info(f"Deployment deleted: {deployment_id}")

        except Exception as e:
            logger.error(f"Failed to delete deployment: {e}")
            raise

    async def deploy_agent_cli(
        self,
        deployment_id: str,
        agent_name: str,
        files: Dict[str, str],
        region: str = "us-west-2",
        version: int = 1,
        progress_callback: Optional[Callable] = None,
        integration_details: list = None
    ) -> DeploymentResult:
        """
        AgentCore CLI를 사용한 배포 프로세스

        1. 코드 파일 저장
        2. agentcore.yaml 생성
        3. Gateway/Identity 생성 (필요시)
        4. agentcore deploy 실행
        5. Runtime READY 대기

        Args:
            deployment_id: 배포 ID
            agent_name: Agent 이름
            files: 생성된 코드 파일 딕셔너리
            region: AWS 리전
            version: 버전 번호
            progress_callback: 진행률 콜백
            integration_details: 통합 목록 (Gateway/Identity 생성용)

        Returns:
            DeploymentResult
        """
        # Agent 이름 검증 및 변환 (CLI 규칙에 맞게)
        original_name = agent_name
        agent_name = sanitize_agent_name(agent_name)
        if original_name != agent_name:
            logger.info(f"Agent name sanitized: '{original_name}' -> '{agent_name}'")

        logger.info(f"Starting CLI deployment: {deployment_id}")
        logger.info(f"  Agent Name: {agent_name}")
        logger.info(f"  Version: v{version}")
        logger.info(f"  Region: {region}")

        project_dir = Path(f"/tmp/code-generation-jobs/{deployment_id}")

        try:
            # Step 1: 코드 파일 저장
            if progress_callback:
                await progress_callback(5, "코드 파일 저장 중...")

            self.save_generated_files(project_dir, files)

            if progress_callback:
                await progress_callback(10, "코드 파일 저장 완료")

            # Step 2: agentcore.yaml 생성
            if progress_callback:
                await progress_callback(15, "배포 설정 생성 중...")

            cli = AgentCoreCLI(region=region)
            if not cli.configure(project_dir, agent_name):
                raise RuntimeError("Failed to create agentcore.yaml")

            if progress_callback:
                await progress_callback(20, "배포 설정 생성 완료")

            # Step 3: Gateway/Identity 생성 (필요시)
            gateway_info = None
            if integration_details:
                gateway_info = await self._create_gateway_for_deployment(
                    deployment_id, agent_name, integration_details, progress_callback
                )

            # Step 4: agentcore deploy 실행
            if progress_callback:
                await progress_callback(50, "AgentCore 배포 중... (CLI)")

            logger.info("Running agentcore deploy...")

            # subprocess는 동기적이므로 executor에서 실행
            loop = asyncio.get_event_loop()
            deploy_result = await loop.run_in_executor(
                None,
                lambda: cli.deploy(project_dir, agent_name)
            )

            runtime_id = deploy_result.get('runtime_id')
            runtime_arn = deploy_result.get('runtime_arn')
            endpoint_url = deploy_result.get('endpoint_url')

            if progress_callback:
                await progress_callback(50, f"배포 요청 완료: {agent_name}")

            # Step 4: Runtime READY 대기
            if progress_callback:
                await progress_callback(55, "Runtime 준비 대기 중...")

            timeout = 300  # 5분
            poll_interval = 10
            start_time = time.time()

            while True:
                elapsed = time.time() - start_time

                if elapsed > timeout:
                    raise TimeoutError(f"Runtime failed to become ready within {timeout} seconds")

                # status 확인 (agent_name과 project_dir 사용)
                status_info = await loop.run_in_executor(
                    None,
                    lambda: cli.status(agent_name, project_dir)
                )

                status = status_info.get('status', 'UNKNOWN')
                logger.info(f"Runtime status: {status} (elapsed: {elapsed:.0f}s)")

                if status == 'READY':
                    endpoint_url = status_info.get('endpoint_url') or endpoint_url
                    if progress_callback:
                        await progress_callback(95, "Runtime 준비 완료")
                    break

                if status == 'FAILED':
                    error = status_info.get('error', 'Unknown error')
                    raise RuntimeError(f"Runtime creation failed: {error}")

                # 진행률 업데이트
                if progress_callback:
                    progress = 55 + int((elapsed / timeout) * 35)
                    await progress_callback(min(progress, 90), f"Runtime 시작 중... ({int(elapsed)}s)")

                await asyncio.sleep(poll_interval)

            logger.info(f"CLI Deployment completed: {deployment_id}")
            logger.info(f"  Runtime ID: {runtime_id}")
            logger.info(f"  Runtime ARN: {runtime_arn}")
            logger.info(f"  Endpoint: {endpoint_url}")
            if gateway_info:
                logger.info(f"  Gateway ID: {gateway_info.get('gateway_id')}")
                logger.info(f"  Gateway URL: {gateway_info.get('gateway_url')}")

            return DeploymentResult(
                success=True,
                s3_uri=f"cli://{agent_name}/v{version}",  # CLI는 S3 URI 대신 가상 경로
                runtime_id=runtime_id,
                runtime_arn=runtime_arn,
                endpoint_url=endpoint_url,
                gateway_id=gateway_info.get('gateway_id') if gateway_info else None,
                gateway_url=gateway_info.get('gateway_url') if gateway_info else None,
                identity_providers=gateway_info.get('identity_providers', []) if gateway_info else []
            )

        except Exception as e:
            logger.error(f"CLI Deployment failed: {e}", exc_info=True)
            return DeploymentResult(
                success=False,
                error=str(e)
            )

        finally:
            # 프로젝트 디렉토리 정리 (선택적)
            # CLI 배포 후에도 소스 코드는 유지할 수 있음
            pass

    async def deploy_agent(
        self,
        deployment_id: str,
        agent_name: str,
        files: Dict[str, str],
        region: str = "us-west-2",
        version: int = 1,
        progress_callback: Optional[Callable] = None,
        use_cli: bool = False,  # boto3 API 사용 (기본값, 권장)
        integration_details: list = None  # Gateway/Identity 생성용
    ) -> DeploymentResult:
        """
        전체 배포 프로세스 실행

        use_cli=False (기본값, 권장): boto3 API 직접 호출
        use_cli=True: AgentCore CLI 사용 (CLI 출력 파싱 문제가 있을 수 있음)

        Args:
            deployment_id: 배포 ID
            agent_name: Agent 이름
            files: 생성된 코드 파일 딕셔너리
            region: AWS 리전
            version: 버전 번호
            progress_callback: 진행률 콜백
            use_cli: CLI 사용 여부
            integration_details: 통합 목록 (Gateway/Identity 생성용)

        Returns:
            DeploymentResult
        """
        # CLI 사용 (레거시, CLI 출력 파싱 문제가 있을 수 있음)
        if use_cli:
            return await self.deploy_agent_cli(
                deployment_id=deployment_id,
                agent_name=agent_name,
                files=files,
                region=region,
                version=version,
                progress_callback=progress_callback,
                integration_details=integration_details
            )

        # boto3 API 사용 (권장)
        # Agent 이름 정제 (API 규칙에 맞게)
        original_name = agent_name
        agent_name = sanitize_agent_name(agent_name)
        if original_name != agent_name:
            logger.info(f"Agent name sanitized: '{original_name}' -> '{agent_name}'")

        logger.info(f"Starting deployment (boto3): {deployment_id}")
        logger.info(f"  Agent Name: {agent_name}")
        logger.info(f"  Version: v{version}")
        logger.info(f"  Region: {region}")

        code_path = None
        build_dir = None
        gateway_info = None

        try:
            # Step 1: 코드 파일 저장
            if progress_callback:
                await progress_callback(5, "코드 파일 저장 중...")

            code_path = Path(f"/tmp/code-generation-jobs/{deployment_id}")
            self.save_generated_files(code_path, files)

            if progress_callback:
                await progress_callback(10, "코드 파일 저장 완료")

            # Step 2: Gateway/Identity 생성 (필요시)
            if integration_details:
                gateway_info = await self._create_gateway_for_deployment(
                    deployment_id, agent_name, integration_details, progress_callback
                )

            # Step 3: 배포 패키지 빌드 (uv)
            if progress_callback:
                await progress_callback(20, "배포 패키지 빌드 중...")

            logger.info("Building deployment package with uv...")
            zip_path = self.build_deployment_package(
                code_path,
                agent_name,
                progress_callback=progress_callback
            )
            build_dir = zip_path.parent

            if progress_callback:
                await progress_callback(45, "배포 패키지 빌드 완료")

            # Step 4: S3 업로드
            if progress_callback:
                await progress_callback(50, "S3 업로드 중...")

            logger.info("Uploading to S3...")
            s3_uri = self.upload_to_s3(
                zip_path,
                agent_name,
                version=version,
                progress_callback=progress_callback
            )

            # S3 버킷과 키 추출
            bucket_name = self.get_s3_bucket_name()
            s3_key = f"{agent_name}/v{version}/deployment_package.zip"

            if progress_callback:
                await progress_callback(60, "S3 업로드 완료")

            # Step 5: AgentCore Runtime 생성
            if progress_callback:
                await progress_callback(65, "Runtime 생성 중...")

            logger.info("Creating AgentCore Runtime...")
            runtime_result = self.create_runtime(
                agent_name,
                bucket_name,
                s3_key,
                progress_callback=progress_callback
            )

            if progress_callback:
                await progress_callback(75, "Runtime 생성 요청 완료, 시작 대기 중...")

            # Step 6: Runtime READY 대기
            logger.info("Waiting for runtime to become ready...")
            runtime_status = await self.wait_for_runtime_ready(
                runtime_result['runtime_id'],
                timeout=300,
                poll_interval=10,
                progress_callback=progress_callback
            )

            endpoint_url = runtime_status.get('endpoint_url') or runtime_result.get('endpoint_url')

            logger.info(f"Deployment completed (boto3): {deployment_id}")
            logger.info(f"  Runtime ID: {runtime_result['runtime_id']}")
            logger.info(f"  Runtime ARN: {runtime_result['runtime_arn']}")
            logger.info(f"  Endpoint: {endpoint_url}")
            if gateway_info:
                logger.info(f"  Gateway ID: {gateway_info.get('gateway_id')}")
                logger.info(f"  Gateway URL: {gateway_info.get('gateway_url')}")

            return DeploymentResult(
                success=True,
                s3_uri=s3_uri,
                runtime_id=runtime_result['runtime_id'],
                runtime_arn=runtime_result['runtime_arn'],
                endpoint_url=endpoint_url,
                gateway_id=gateway_info.get('gateway_id') if gateway_info else None,
                gateway_url=gateway_info.get('gateway_url') if gateway_info else None,
                identity_providers=gateway_info.get('identity_providers', []) if gateway_info else []
            )

        except Exception as e:
            logger.error(f"Deployment failed: {e}", exc_info=True)
            return DeploymentResult(
                success=False,
                error=str(e)
            )

        finally:
            # 빌드 디렉토리 정리
            if build_dir and build_dir.exists():
                try:
                    shutil.rmtree(build_dir, ignore_errors=True)
                except Exception:
                    pass


    async def deploy_mcp_server(
        self,
        mcp_server_id: str,
        name: str,
        main_py: str,
        requirements: str,
        progress_callback: Optional[Callable] = None,
        version: Optional[int] = None  # 버전 지정 (없으면 자동 증가)
    ) -> DeploymentResult:
        """
        MCP 서버를 AgentCore Runtime에 배포

        Args:
            mcp_server_id: MCP 서버 ID (DynamoDB에서 상태 업데이트용)
            name: MCP 서버 이름
            main_py: main.py 코드 내용
            requirements: requirements.txt 내용
            progress_callback: 진행률 콜백 (async)
            version: 버전 지정 (없으면 자동 증가)

        Returns:
            DeploymentResult
        """
        # mcp_deployment_manager에서 버전 가져오기
        from mcp_deployment_manager import mcp_deployment_manager

        # 버전 결정 (지정되지 않으면 자동 증가)
        if version is None:
            version = mcp_deployment_manager.get_next_version(mcp_server_id)

        # 이름 정제
        original_name = name
        sanitized_name = sanitize_agent_name(f"mcp_{name}")
        if original_name != sanitized_name:
            logger.info(f"MCP server name sanitized: '{original_name}' -> '{sanitized_name}'")

        logger.info(f"Starting MCP server deployment: {mcp_server_id}")
        logger.info(f"  Name: {sanitized_name}")
        logger.info(f"  Version: v{version}")

        code_path = None
        build_dir = None

        try:
            # Step 1: 코드 파일 저장
            if progress_callback:
                await progress_callback(5, "코드 파일 저장 중...")

            code_path = Path(f"/tmp/mcp-deployments/{mcp_server_id}")
            files = {
                "main.py": main_py,
                "requirements.txt": requirements
            }
            self.save_generated_files(code_path, files)

            if progress_callback:
                await progress_callback(10, "코드 파일 저장 완료")

            # Step 2: 배포 패키지 빌드 (uv)
            if progress_callback:
                await progress_callback(15, "배포 패키지 빌드 중...")

            logger.info("Building MCP server deployment package...")
            zip_path = self.build_deployment_package(
                code_path,
                sanitized_name,
                progress_callback=progress_callback
            )
            build_dir = zip_path.parent

            if progress_callback:
                await progress_callback(45, "배포 패키지 빌드 완료")

            # Step 3: S3 업로드 (버전 포함)
            if progress_callback:
                await progress_callback(50, "S3 업로드 중...")

            logger.info(f"Uploading MCP server to S3 (v{version})...")
            s3_uri = self.upload_to_s3(
                zip_path,
                sanitized_name,
                version=version,  # 버전 적용
                progress_callback=progress_callback
            )

            bucket_name = self.get_s3_bucket_name()
            s3_key = f"{sanitized_name}/v{version}/deployment_package.zip"

            if progress_callback:
                await progress_callback(60, "S3 업로드 완료")

            # Step 4: AgentCore Runtime 생성 (MCP 프로토콜 사용)
            if progress_callback:
                await progress_callback(65, "Runtime 생성 중...")

            logger.info("Creating AgentCore Runtime for MCP server (protocol=MCP)...")
            runtime_result = self.create_runtime(
                sanitized_name,
                bucket_name,
                s3_key,
                progress_callback=progress_callback,
                protocol_type="MCP"  # MCP 서버는 MCP 프로토콜 사용
            )

            if progress_callback:
                await progress_callback(75, "Runtime 생성 요청 완료, 시작 대기 중...")

            # Step 5: Runtime READY 대기
            logger.info("Waiting for MCP server runtime to become ready...")
            runtime_status = await self.wait_for_runtime_ready(
                runtime_result['runtime_id'],
                timeout=300,
                poll_interval=10,
                progress_callback=progress_callback
            )

            endpoint_url = runtime_status.get('endpoint_url') or runtime_result.get('endpoint_url')

            logger.info(f"MCP server deployment completed: {mcp_server_id}")
            logger.info(f"  Runtime ID: {runtime_result['runtime_id']}")
            logger.info(f"  Runtime ARN: {runtime_result['runtime_arn']}")
            logger.info(f"  Endpoint: {endpoint_url}")

            return DeploymentResult(
                success=True,
                s3_uri=s3_uri,
                runtime_id=runtime_result['runtime_id'],
                runtime_arn=runtime_result['runtime_arn'],
                endpoint_url=endpoint_url
            )

        except Exception as e:
            logger.error(f"MCP server deployment failed: {e}", exc_info=True)
            return DeploymentResult(
                success=False,
                error=str(e)
            )

        finally:
            # 빌드 디렉토리 정리
            if build_dir and build_dir.exists():
                try:
                    shutil.rmtree(build_dir, ignore_errors=True)
                except Exception:
                    pass


# 싱글톤 인스턴스
deployment_service = DeploymentService()
