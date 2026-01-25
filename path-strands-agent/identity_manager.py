"""
Identity Manager - AgentCore Credential Provider 관리

AgentCore Identity는 외부 서비스 인증을 위한 Credential Provider를 관리합니다.
- API Key Provider: API 키 기반 인증
- OAuth2 Provider: OAuth 2.0 클라이언트 자격 증명 (2-legged OAuth)
"""
import logging
from typing import Dict, Optional, List, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

try:
    import boto3
    from botocore.exceptions import ClientError
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False
    logger.warning("boto3 not installed - Identity features disabled")


@dataclass
class CredentialProvider:
    """Credential Provider 정보"""
    provider_arn: str
    provider_type: str  # 'api_key' or 'oauth2'
    name: str
    status: str = "ACTIVE"


class IdentityManager:
    """AgentCore Identity (Credential Provider) 관리"""

    def __init__(self, region: str = "us-west-2"):
        self.region = region

        if HAS_BOTO3:
            try:
                self.client = boto3.client('bedrock-agentcore-control', region_name=region)
                self.sts_client = boto3.client('sts', region_name=region)
                logger.info("IdentityManager initialized with boto3 clients")
            except Exception as e:
                logger.warning(f"AgentCore client not available: {e}")
                self.client = None
                self.sts_client = None
        else:
            self.client = None
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

    def create_api_key_provider(
        self,
        name: str,
        api_key: str
    ) -> str:
        """
        API Key Credential Provider 생성

        Args:
            name: Provider 이름
            api_key: API 키 값

        Returns:
            Provider ARN
        """
        if not self.client:
            # Mock response
            account_id = self.get_account_id()
            logger.info(f"[Mock] Creating API Key provider: {name}")
            return f"arn:aws:bedrock-agentcore:{self.region}:{account_id}:apikeycredentialprovider/{name}"

        try:
            response = self.client.create_api_key_credential_provider(
                name=name,
                apiKey=api_key
            )

            provider_arn = response["apiKeyCredentialProviderArn"]
            logger.info(f"API Key provider created: {provider_arn}")
            return provider_arn

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_msg = e.response['Error']['Message']
            logger.error(f"Failed to create API key provider: {error_code} - {error_msg}")
            raise

    def create_oauth2_provider(
        self,
        name: str,
        client_id: str,
        client_secret: str,
        token_endpoint: str,
        scopes: Optional[List[str]] = None
    ) -> str:
        """
        OAuth2 Credential Provider 생성 (2-legged OAuth / Client Credentials)

        Args:
            name: Provider 이름
            client_id: OAuth2 클라이언트 ID
            client_secret: OAuth2 클라이언트 시크릿
            token_endpoint: 토큰 엔드포인트 URL
            scopes: OAuth2 스코프 목록

        Returns:
            Provider ARN
        """
        if not self.client:
            # Mock response
            account_id = self.get_account_id()
            logger.info(f"[Mock] Creating OAuth2 provider: {name}")
            return f"arn:aws:bedrock-agentcore:{self.region}:{account_id}:oauth2credentialprovider/{name}"

        try:
            oauth_config = {
                "clientId": client_id,
                "clientSecret": client_secret,
                "tokenEndpoint": token_endpoint
            }
            if scopes:
                oauth_config["scopes"] = scopes

            response = self.client.create_oauth2_credential_provider(
                name=name,
                credentialProviderVendor="CustomOauth2",
                oauth2ProviderConfigInput=oauth_config
            )

            provider_arn = response["oauth2CredentialProviderArn"]
            logger.info(f"OAuth2 provider created: {provider_arn}")
            return provider_arn

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_msg = e.response['Error']['Message']
            logger.error(f"Failed to create OAuth2 provider: {error_code} - {error_msg}")
            raise

    def get_api_key_provider(self, provider_arn: str) -> Optional[Dict[str, Any]]:
        """API Key Provider 정보 조회"""
        if not self.client:
            return {
                "apiKeyCredentialProviderArn": provider_arn,
                "name": provider_arn.split('/')[-1],
                "status": "ACTIVE"
            }

        try:
            response = self.client.get_api_key_credential_provider(
                apiKeyCredentialProviderArn=provider_arn
            )
            return response
        except ClientError as e:
            logger.error(f"Failed to get API key provider: {e}")
            return None

    def get_oauth2_provider(self, provider_arn: str) -> Optional[Dict[str, Any]]:
        """OAuth2 Provider 정보 조회"""
        if not self.client:
            return {
                "oauth2CredentialProviderArn": provider_arn,
                "name": provider_arn.split('/')[-1],
                "status": "ACTIVE"
            }

        try:
            response = self.client.get_oauth2_credential_provider(
                oauth2CredentialProviderArn=provider_arn
            )
            return response
        except ClientError as e:
            logger.error(f"Failed to get OAuth2 provider: {e}")
            return None

    def list_api_key_providers(self) -> List[CredentialProvider]:
        """API Key Provider 목록 조회"""
        if not self.client:
            return []

        try:
            response = self.client.list_api_key_credential_providers()
            providers = []
            for item in response.get('apiKeyCredentialProviders', []):
                providers.append(CredentialProvider(
                    provider_arn=item['apiKeyCredentialProviderArn'],
                    provider_type='api_key',
                    name=item.get('name', ''),
                    status=item.get('status', 'UNKNOWN')
                ))
            return providers
        except ClientError as e:
            logger.error(f"Failed to list API key providers: {e}")
            return []

    def list_oauth2_providers(self) -> List[CredentialProvider]:
        """OAuth2 Provider 목록 조회"""
        if not self.client:
            return []

        try:
            response = self.client.list_oauth2_credential_providers()
            providers = []
            for item in response.get('oauth2CredentialProviders', []):
                providers.append(CredentialProvider(
                    provider_arn=item['oauth2CredentialProviderArn'],
                    provider_type='oauth2',
                    name=item.get('name', ''),
                    status=item.get('status', 'UNKNOWN')
                ))
            return providers
        except ClientError as e:
            logger.error(f"Failed to list OAuth2 providers: {e}")
            return []

    def delete_api_key_provider(self, provider_arn: str) -> bool:
        """API Key Provider 삭제"""
        if not self.client:
            logger.info(f"[Mock] Deleting API key provider: {provider_arn}")
            return True

        try:
            self.client.delete_api_key_credential_provider(
                apiKeyCredentialProviderArn=provider_arn
            )
            logger.info(f"API key provider deleted: {provider_arn}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete API key provider: {e}")
            return False

    def delete_oauth2_provider(self, provider_arn: str) -> bool:
        """OAuth2 Provider 삭제"""
        if not self.client:
            logger.info(f"[Mock] Deleting OAuth2 provider: {provider_arn}")
            return True

        try:
            self.client.delete_oauth2_credential_provider(
                oauth2CredentialProviderArn=provider_arn
            )
            logger.info(f"OAuth2 provider deleted: {provider_arn}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete OAuth2 provider: {e}")
            return False

    def delete_credential_provider(self, provider_arn: str) -> bool:
        """
        Credential Provider 삭제 (ARN으로 타입 자동 판단)

        Args:
            provider_arn: Provider ARN

        Returns:
            성공 여부
        """
        if "apikeycredentialprovider" in provider_arn.lower():
            return self.delete_api_key_provider(provider_arn)
        elif "oauth2credentialprovider" in provider_arn.lower():
            return self.delete_oauth2_provider(provider_arn)
        else:
            logger.error(f"Unknown provider type: {provider_arn}")
            return False

    def create_credential_provider_for_integration(
        self,
        integration: Dict[str, Any],
        agent_name: str
    ) -> Optional[str]:
        """
        통합 정보를 기반으로 적절한 Credential Provider 생성

        Args:
            integration: 통합 정보
            agent_name: Agent 이름

        Returns:
            Provider ARN (필요 없으면 None)
        """
        int_type = integration.get('type', '')
        name = integration.get('name', '')
        config = integration.get('config', {})

        if int_type != 'api':
            # API 통합만 Credential Provider 필요
            return None

        auth_type = config.get('authType', 'none')
        auth_config = config.get('authConfig', {})

        if auth_type == 'none':
            return None

        safe_name = f"{agent_name}-{name}".replace(' ', '-').lower()[:48]

        if auth_type == 'api-key':
            api_key = auth_config.get('apiKeyValue', '')
            if api_key:
                return self.create_api_key_provider(
                    name=f"{safe_name}-apikey",
                    api_key=api_key
                )

        elif auth_type == 'oauth2':
            client_id = auth_config.get('oauth2ClientId', '')
            client_secret = auth_config.get('oauth2ClientSecret', '')
            token_url = auth_config.get('oauth2TokenUrl', '')
            scopes = auth_config.get('oauth2Scopes', [])

            if client_id and client_secret and token_url:
                return self.create_oauth2_provider(
                    name=f"{safe_name}-oauth2",
                    client_id=client_id,
                    client_secret=client_secret,
                    token_endpoint=token_url,
                    scopes=scopes if scopes else None
                )

        elif auth_type == 'bearer':
            # Bearer token은 API Key로 처리
            token = auth_config.get('bearerToken', '')
            if token:
                return self.create_api_key_provider(
                    name=f"{safe_name}-bearer",
                    api_key=token
                )

        return None


# 싱글톤 인스턴스
identity_manager = IdentityManager()
