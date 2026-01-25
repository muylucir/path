"""
Gateway Manager - AgentCore Gateway 생성 및 관리

AgentCore Gateway는 MCP 표준을 통해 외부 서비스(API, MCP Server)를 Agent에 연결합니다.
인증은 Cognito User Pool JWT를 사용합니다.
"""
import os
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# 공용 Cognito User Pool 이름 - 모든 Gateway가 공유
SHARED_COGNITO_POOL_NAME = "path-agent-shared-pool"

try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False
    logger.warning("boto3 not installed - Gateway features disabled")


@dataclass
class GatewayTarget:
    """Gateway Target 정보"""
    target_id: str
    name: str
    target_type: str  # 'openapi', 'mcp', 'lambda'


@dataclass
class GatewayResult:
    """Gateway 생성 결과"""
    gateway_id: str
    gateway_url: str
    target_ids: List[str] = field(default_factory=list)
    cognito_config: Optional[Dict[str, str]] = None


class GatewayManager:
    """AgentCore Gateway 관리"""

    def build_credential_config(
        self,
        auth_type: str,
        provider_arn: Optional[str] = None,
        provider_type: Optional[str] = None,
        api_key_config: Optional[Dict] = None,
        oauth_scopes: Optional[List[str]] = None
    ) -> Dict:
        """
        Gateway Target용 Credential Configuration 빌드

        Args:
            auth_type: 인증 유형 ('iam', 'api-key', 'oauth')
            provider_arn: Credential Provider ARN (api-key, oauth에 필요)
            provider_type: Provider 유형 ('api-key' or 'oauth2') - deprecated, use auth_type
            api_key_config: API Key 설정 (선택)
                - headerName: 헤더 이름 (기본: 'X-API-Key')
            oauth_scopes: OAuth scope 목록 (선택)

        Returns:
            AgentCore API용 Credential Configuration

        Example:
            # IAM Role
            {
                "credentialProviderType": "GATEWAY_IAM_ROLE"
            }

            # API Key Provider
            {
                "credentialProviderType": "API_KEY",
                "credentialProvider": {
                    "apiKeyCredentialProvider": {
                        "providerArn": "arn:aws:bedrock-agentcore:...",
                        "credentialLocation": "HEADER",
                        "credentialParameterName": "X-API-Key"
                    }
                }
            }

            # OAuth2 Provider
            {
                "credentialProviderType": "OAUTH",
                "credentialProvider": {
                    "oauthCredentialProvider": {
                        "providerArn": "arn:aws:bedrock-agentcore:...",
                        "grantType": "CLIENT_CREDENTIALS",
                        "scopes": ["read:data"]
                    }
                }
            }
        """
        # Handle IAM role authentication
        if auth_type == 'iam':
            return {"credentialProviderType": "GATEWAY_IAM_ROLE"}

        # Handle API Key authentication
        if auth_type == 'api-key' or provider_type == 'api-key':
            if not provider_arn:
                logger.warning("API Key auth requested but no provider ARN, falling back to IAM")
                return {"credentialProviderType": "GATEWAY_IAM_ROLE"}

            header_name = 'X-API-Key'
            if api_key_config and api_key_config.get('headerName'):
                header_name = api_key_config['headerName']

            return {
                "credentialProviderType": "API_KEY",
                "credentialProvider": {
                    "apiKeyCredentialProvider": {
                        "providerArn": provider_arn,
                        "credentialLocation": "HEADER",
                        "credentialParameterName": header_name
                    }
                }
            }

        # Handle OAuth authentication
        if auth_type == 'oauth' or provider_type == 'oauth2':
            if not provider_arn:
                logger.warning("OAuth auth requested but no provider ARN, falling back to IAM")
                return {"credentialProviderType": "GATEWAY_IAM_ROLE"}

            oauth_config: Dict[str, Any] = {
                "providerArn": provider_arn,
                "grantType": "CLIENT_CREDENTIALS"
            }
            if oauth_scopes:
                oauth_config["scopes"] = oauth_scopes

            return {
                "credentialProviderType": "OAUTH",
                "credentialProvider": {
                    "oauthCredentialProvider": oauth_config
                }
            }

        # Default to IAM role
        logger.warning(f"Unknown auth type: {auth_type}, using IAM role")
        return {"credentialProviderType": "GATEWAY_IAM_ROLE"}

    def __init__(self, region: str = "us-west-2"):
        self.region = region

        if HAS_BOTO3:
            try:
                self.client = boto3.client('bedrock-agentcore-control', region_name=region)
                self.cognito_client = boto3.client('cognito-idp', region_name=region)
                self.sts_client = boto3.client('sts', region_name=region)
                logger.info("GatewayManager initialized with boto3 clients")
            except Exception as e:
                logger.warning(f"AgentCore client not available: {e}")
                self.client = None
                self.cognito_client = None
                self.sts_client = None
        else:
            self.client = None
            self.cognito_client = None
            self.sts_client = None

    def get_account_id(self) -> str:
        """AWS Account ID 조회"""
        if not self.sts_client:
            return "123456789012"  # Mock
        try:
            return self.sts_client.get_caller_identity()['Account']
        except Exception as e:
            logger.error(f"Failed to get account ID: {e}")
            return "123456789012"

    def get_or_create_cognito_pool(self, pool_name: str = "path-agent-gateway") -> Dict[str, str]:
        """
        Cognito User Pool 조회 또는 생성

        Returns:
            {
                "user_pool_id": "...",
                "client_id": "...",
                "discovery_url": "https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/openid-configuration"
            }
        """
        if not self.cognito_client:
            # Mock response
            return {
                "user_pool_id": "mock-pool-id",
                "client_id": "mock-client-id",
                "discovery_url": f"https://cognito-idp.{self.region}.amazonaws.com/mock-pool-id/.well-known/openid-configuration"
            }

        try:
            # 기존 풀 검색
            pools = self.cognito_client.list_user_pools(MaxResults=50)
            for pool in pools.get('UserPools', []):
                if pool['Name'] == pool_name:
                    pool_id = pool['Id']
                    # 클라이언트 조회
                    clients = self.cognito_client.list_user_pool_clients(
                        UserPoolId=pool_id, MaxResults=10
                    )
                    client_id = None
                    if clients.get('UserPoolClients'):
                        client_id = clients['UserPoolClients'][0]['ClientId']

                    if not client_id:
                        # 클라이언트 생성
                        client_response = self.cognito_client.create_user_pool_client(
                            UserPoolId=pool_id,
                            ClientName=f"{pool_name}-client",
                            GenerateSecret=False,
                            ExplicitAuthFlows=[
                                'ALLOW_USER_PASSWORD_AUTH',
                                'ALLOW_REFRESH_TOKEN_AUTH',
                                'ALLOW_USER_SRP_AUTH'
                            ]
                        )
                        client_id = client_response['UserPoolClient']['ClientId']

                    return {
                        "user_pool_id": pool_id,
                        "client_id": client_id,
                        "discovery_url": f"https://cognito-idp.{self.region}.amazonaws.com/{pool_id}/.well-known/openid-configuration"
                    }

            # 새 풀 생성
            logger.info(f"Creating new Cognito User Pool: {pool_name}")
            pool_response = self.cognito_client.create_user_pool(
                PoolName=pool_name,
                AutoVerifiedAttributes=['email'],
                UsernameAttributes=['email'],
                Policies={
                    'PasswordPolicy': {
                        'MinimumLength': 8,
                        'RequireUppercase': True,
                        'RequireLowercase': True,
                        'RequireNumbers': True,
                        'RequireSymbols': False
                    }
                },
                AdminCreateUserConfig={
                    'AllowAdminCreateUserOnly': False
                }
            )
            pool_id = pool_response['UserPool']['Id']

            # 클라이언트 생성
            client_response = self.cognito_client.create_user_pool_client(
                UserPoolId=pool_id,
                ClientName=f"{pool_name}-client",
                GenerateSecret=False,
                ExplicitAuthFlows=[
                    'ALLOW_USER_PASSWORD_AUTH',
                    'ALLOW_REFRESH_TOKEN_AUTH',
                    'ALLOW_USER_SRP_AUTH'
                ]
            )
            client_id = client_response['UserPoolClient']['ClientId']

            logger.info(f"Created Cognito User Pool: {pool_id}")

            return {
                "user_pool_id": pool_id,
                "client_id": client_id,
                "discovery_url": f"https://cognito-idp.{self.region}.amazonaws.com/{pool_id}/.well-known/openid-configuration"
            }

        except ClientError as e:
            logger.error(f"Cognito error: {e}")
            raise

    def get_shared_cognito_pool(self) -> Dict[str, str]:
        """
        앱 전체에서 공유하는 Cognito User Pool 조회/생성

        모든 Gateway가 동일한 Cognito User Pool과 Client를 공유하여:
        - 리소스 절약
        - 중앙 집중식 사용자 관리
        - 간편한 운영

        Returns:
            {
                "user_pool_id": "...",
                "client_id": "...",
                "discovery_url": "https://cognito-idp.{region}.amazonaws.com/{pool_id}/.well-known/openid-configuration"
            }
        """
        return self.get_or_create_cognito_pool(SHARED_COGNITO_POOL_NAME)

    def create_gateway(
        self,
        name: str,
        role_arn: str,
        enable_semantic_search: bool = True,
        cognito_config: Optional[Dict[str, str]] = None
    ) -> GatewayResult:
        """
        Gateway 생성 (Cognito JWT 인증 포함)

        Args:
            name: Gateway 이름
            role_arn: IAM Role ARN
            enable_semantic_search: Semantic Search 활성화 여부
            cognito_config: Cognito 설정 (없으면 자동 생성)

        Returns:
            GatewayResult
        """
        if not self.client:
            # Mock response
            logger.info(f"[Mock] Creating Gateway: {name}")
            return GatewayResult(
                gateway_id=f"gateway-mock-{name}",
                gateway_url=f"https://gateway-mock.{self.region}.amazonaws.com/mcp",
                target_ids=[],
                cognito_config=cognito_config or {
                    "user_pool_id": "mock-pool-id",
                    "client_id": "mock-client-id",
                    "discovery_url": f"https://cognito-idp.{self.region}.amazonaws.com/mock-pool-id/.well-known/openid-configuration"
                }
            )

        try:
            # Cognito 설정이 없으면 공용 Pool 사용 (리소스 절약)
            if not cognito_config:
                cognito_config = self.get_shared_cognito_pool()

            # Inbound Auth 설정 (Cognito JWT)
            auth_config = {
                "customJWTAuthorizer": {
                    "discoveryUrl": cognito_config["discovery_url"],
                    "allowedClients": [cognito_config["client_id"]]
                }
            }

            # Protocol Configuration
            protocol_config = {
                "mcp": {
                    "supportedVersions": ["2025-03-26"]
                }
            }
            if enable_semantic_search:
                protocol_config["mcp"]["searchType"] = "SEMANTIC"

            response = self.client.create_gateway(
                name=name,
                roleArn=role_arn,
                protocolType='MCP',
                authorizerType='CUSTOM_JWT',
                authorizerConfiguration=auth_config,
                protocolConfiguration=protocol_config
            )

            logger.info(f"Gateway created: {response['gatewayId']}")

            return GatewayResult(
                gateway_id=response["gatewayId"],
                gateway_url=response.get("gatewayUrl", ""),
                target_ids=[],
                cognito_config=cognito_config
            )

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_msg = e.response['Error']['Message']
            logger.error(f"Failed to create gateway: {error_code} - {error_msg}")
            raise

    def add_openapi_target(
        self,
        gateway_id: str,
        name: str,
        openapi_s3_uri: str,
        bucket_owner_account_id: Optional[str] = None,
        credential_config: Optional[Dict] = None
    ) -> str:
        """
        OpenAPI Target 추가 (API 통합용)

        Args:
            gateway_id: Gateway ID
            name: Target 이름
            openapi_s3_uri: S3에 업로드된 OpenAPI 스키마 URI
            bucket_owner_account_id: S3 버킷 소유자 계정 ID
            credential_config: 인증 설정

        Returns:
            Target ID
        """
        if not self.client:
            logger.info(f"[Mock] Adding OpenAPI target: {name}")
            return f"target-mock-{name}"

        try:
            account_id = bucket_owner_account_id or self.get_account_id()

            target_config = {
                "mcp": {
                    "openApiSchema": {
                        "s3": {
                            "uri": openapi_s3_uri,
                            "bucketOwnerAccountId": account_id
                        }
                    }
                }
            }

            cred_configs = []
            if credential_config:
                cred_configs.append(credential_config)
            else:
                cred_configs.append({"credentialProviderType": "GATEWAY_IAM_ROLE"})

            response = self.client.create_gateway_target(
                gatewayIdentifier=gateway_id,
                name=name,
                targetConfiguration=target_config,
                credentialProviderConfigurations=cred_configs
            )

            logger.info(f"OpenAPI target added: {response['targetId']}")
            return response["targetId"]

        except ClientError as e:
            logger.error(f"Failed to add OpenAPI target: {e}")
            raise

    def add_mcp_server_target(
        self,
        gateway_id: str,
        name: str,
        mcp_server_url: str,
        credential_config: Optional[Dict] = None
    ) -> str:
        """
        MCP Server Target 추가 (MCP 통합용)

        Args:
            gateway_id: Gateway ID
            name: Target 이름
            mcp_server_url: MCP 서버 URL
            credential_config: 인증 설정

        Returns:
            Target ID
        """
        if not self.client:
            logger.info(f"[Mock] Adding MCP server target: {name}")
            return f"target-mock-{name}"

        try:
            target_config = {
                "mcp": {
                    "mcpServer": {
                        "url": mcp_server_url
                    }
                }
            }

            cred_configs = []
            if credential_config:
                cred_configs.append(credential_config)
            else:
                cred_configs.append({"credentialProviderType": "GATEWAY_IAM_ROLE"})

            response = self.client.create_gateway_target(
                gatewayIdentifier=gateway_id,
                name=name,
                targetConfiguration=target_config,
                credentialProviderConfigurations=cred_configs
            )

            logger.info(f"MCP server target added: {response['targetId']}")
            return response["targetId"]

        except ClientError as e:
            logger.error(f"Failed to add MCP server target: {e}")
            raise

    def add_lambda_target(
        self,
        gateway_id: str,
        name: str,
        lambda_arn: str
    ) -> str:
        """
        Lambda Target 추가

        Args:
            gateway_id: Gateway ID
            name: Target 이름
            lambda_arn: Lambda 함수 ARN

        Returns:
            Target ID
        """
        if not self.client:
            logger.info(f"[Mock] Adding Lambda target: {name}")
            return f"target-mock-{name}"

        try:
            response = self.client.create_gateway_target(
                gatewayIdentifier=gateway_id,
                name=name,
                targetConfiguration={
                    "mcp": {
                        "lambdaArn": lambda_arn
                    }
                },
                credentialProviderConfigurations=[
                    {"credentialProviderType": "GATEWAY_IAM_ROLE"}
                ]
            )

            logger.info(f"Lambda target added: {response['targetId']}")
            return response["targetId"]

        except ClientError as e:
            logger.error(f"Failed to add Lambda target: {e}")
            raise

    def add_api_gateway_target(
        self,
        gateway_id: str,
        name: str,
        rest_api_id: str,
        stage: str,
        tool_filters: List[Dict],
        tool_overrides: Optional[List[Dict]] = None,
        credential_config: Optional[Dict] = None
    ) -> str:
        """
        API Gateway Target 추가 (REST API Stage)

        Args:
            gateway_id: Gateway ID
            name: Target 이름
            rest_api_id: REST API ID
            stage: Stage 이름
            tool_filters: Tool 필터 목록 [{"filterPath": "/pets/*", "methods": ["GET", "POST"]}]
            tool_overrides: Tool 오버라이드 목록 (선택)
            credential_config: 인증 설정 (선택)

        Returns:
            Target ID
        """
        if not self.client:
            logger.info(f"[Mock] Adding API Gateway target: {name}")
            return f"target-mock-{name}"

        try:
            # API Gateway Tool Configuration 구성
            api_gateway_tool_config = {
                "toolFilters": tool_filters
            }
            if tool_overrides:
                api_gateway_tool_config["toolOverrides"] = tool_overrides

            target_config = {
                "mcp": {
                    "apiGateway": {
                        "restApiId": rest_api_id,
                        "stage": stage,
                        "apiGatewayToolConfiguration": api_gateway_tool_config
                    }
                }
            }

            cred_configs = []
            if credential_config:
                cred_configs.append(credential_config)
            else:
                cred_configs.append({"credentialProviderType": "GATEWAY_IAM_ROLE"})

            response = self.client.create_gateway_target(
                gatewayIdentifier=gateway_id,
                name=name,
                targetConfiguration=target_config,
                credentialProviderConfigurations=cred_configs
            )

            logger.info(f"API Gateway target added: {response['targetId']}")
            return response["targetId"]

        except ClientError as e:
            logger.error(f"Failed to add API Gateway target: {e}")
            raise

    def add_smithy_model_target(
        self,
        gateway_id: str,
        name: str,
        s3_uri: Optional[str] = None,
        bucket_owner_account_id: Optional[str] = None,
        inline_payload: Optional[str] = None,
        credential_config: Optional[Dict] = None
    ) -> str:
        """
        Smithy Model Target 추가 (AWS Service 정의)

        Args:
            gateway_id: Gateway ID
            name: Target 이름
            s3_uri: S3에 저장된 Smithy 모델 URI (s3_uri 또는 inline_payload 중 하나 필수)
            bucket_owner_account_id: S3 버킷 소유자 계정 ID (선택)
            inline_payload: Inline Smithy 모델 JSON (s3_uri 또는 inline_payload 중 하나 필수)
            credential_config: 인증 설정 (선택)

        Returns:
            Target ID
        """
        if not self.client:
            logger.info(f"[Mock] Adding Smithy Model target: {name}")
            return f"target-mock-{name}"

        try:
            # Smithy Model Configuration 구성
            smithy_config = {}

            if s3_uri:
                s3_config = {"uri": s3_uri}
                if bucket_owner_account_id:
                    s3_config["bucketOwnerAccountId"] = bucket_owner_account_id
                smithy_config["s3"] = s3_config
            elif inline_payload:
                smithy_config["inlinePayload"] = inline_payload
            else:
                raise ValueError("Either s3_uri or inline_payload is required")

            target_config = {
                "mcp": {
                    "smithyModel": smithy_config
                }
            }

            cred_configs = []
            if credential_config:
                cred_configs.append(credential_config)
            else:
                cred_configs.append({"credentialProviderType": "GATEWAY_IAM_ROLE"})

            response = self.client.create_gateway_target(
                gatewayIdentifier=gateway_id,
                name=name,
                targetConfiguration=target_config,
                credentialProviderConfigurations=cred_configs
            )

            logger.info(f"Smithy Model target added: {response['targetId']}")
            return response["targetId"]

        except ClientError as e:
            logger.error(f"Failed to add Smithy Model target: {e}")
            raise

    def get_gateway(self, gateway_id: str) -> Optional[Dict[str, Any]]:
        """Gateway 정보 조회"""
        if not self.client:
            return {
                "gatewayId": gateway_id,
                "status": "READY",
                "gatewayUrl": f"https://{gateway_id}.agentcore.{self.region}.amazonaws.com/mcp"
            }

        try:
            response = self.client.get_gateway(gatewayIdentifier=gateway_id)
            return response
        except ClientError as e:
            logger.error(f"Failed to get gateway: {e}")
            return None

    def list_gateway_targets(self, gateway_id: str) -> List[GatewayTarget]:
        """Gateway에 연결된 Target 목록 조회"""
        if not self.client:
            return []

        try:
            response = self.client.list_gateway_targets(gatewayIdentifier=gateway_id)
            targets = []
            for item in response.get('gatewayTargets', []):
                targets.append(GatewayTarget(
                    target_id=item['targetId'],
                    name=item.get('name', ''),
                    target_type=item.get('targetType', 'unknown')
                ))
            return targets
        except ClientError as e:
            logger.error(f"Failed to list gateway targets: {e}")
            return []

    def delete_gateway_target(self, gateway_id: str, target_id: str) -> bool:
        """Gateway Target 삭제"""
        if not self.client:
            logger.info(f"[Mock] Deleting target: {target_id}")
            return True

        try:
            self.client.delete_gateway_target(
                gatewayIdentifier=gateway_id,
                targetId=target_id
            )
            logger.info(f"Gateway target deleted: {target_id}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete gateway target: {e}")
            return False

    def delete_gateway(self, gateway_id: str) -> bool:
        """
        Gateway 삭제

        Note: Cognito User Pool은 공용(path-agent-shared-pool)이므로 삭제하지 않습니다.
        다른 Gateway에서 사용 중일 수 있으므로 Pool은 수동으로 관리해야 합니다.
        """
        if not self.client:
            logger.info(f"[Mock] Deleting gateway: {gateway_id}")
            return True

        try:
            # 먼저 모든 target 삭제
            targets = self.list_gateway_targets(gateway_id)
            for target in targets:
                self.delete_gateway_target(gateway_id, target.target_id)

            # Gateway 삭제
            self.client.delete_gateway(gatewayIdentifier=gateway_id)
            logger.info(f"Gateway deleted: {gateway_id}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete gateway: {e}")
            return False

    def upload_openapi_to_s3(
        self,
        openapi_spec: Dict[str, Any],
        agent_name: str,
        integration_name: str
    ) -> str:
        """
        OpenAPI 스키마를 S3에 업로드

        Args:
            openapi_spec: OpenAPI 스키마 딕셔너리
            agent_name: Agent 이름
            integration_name: 통합 이름

        Returns:
            S3 URI
        """
        import json

        if not HAS_BOTO3:
            return f"s3://mock-bucket/{agent_name}/{integration_name}-openapi.json"

        try:
            s3_client = boto3.client('s3', region_name=self.region)
            account_id = self.get_account_id()
            bucket_name = os.environ.get('AGENTCORE_S3_BUCKET', f"bedrock-agentcore-code-{account_id}-{self.region}")
            s3_key = f"{agent_name}/openapi/{integration_name}.json"

            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=json.dumps(openapi_spec),
                ContentType='application/json'
            )

            s3_uri = f"s3://{bucket_name}/{s3_key}"
            logger.info(f"OpenAPI schema uploaded: {s3_uri}")
            return s3_uri

        except ClientError as e:
            logger.error(f"Failed to upload OpenAPI schema: {e}")
            raise


# 싱글톤 인스턴스
gateway_manager = GatewayManager()
