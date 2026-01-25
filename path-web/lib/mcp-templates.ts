// Built-in MCP Server Templates
import type { MCPTemplate, MCPServerConfig } from "./types";

export const MCP_TEMPLATES: MCPTemplate[] = [
  {
    id: "weather",
    name: "Weather",
    description: "날씨 정보 조회 및 예보 제공",
    icon: "Cloud",
    category: "utility",
    tools: [
      {
        name: "get_weather",
        description: "특정 위치의 현재 날씨 정보를 조회합니다",
        inputSchema: {
          type: "object",
          properties: {
            location: { type: "string", description: "위치 (도시명 또는 좌표)" },
            units: { type: "string", enum: ["metric", "imperial"], default: "metric" },
          },
          required: ["location"],
        },
      },
      {
        name: "get_forecast",
        description: "특정 위치의 날씨 예보를 조회합니다",
        inputSchema: {
          type: "object",
          properties: {
            location: { type: "string", description: "위치 (도시명 또는 좌표)" },
            days: { type: "number", description: "예보 일수 (1-7)", default: 3 },
          },
          required: ["location"],
        },
      },
    ],
    code: {
      mainPy: `from mcp.server.fastmcp import FastMCP
import httpx

mcp = FastMCP("weather-tools")

WEATHER_API_BASE = "https://api.open-meteo.com/v1"

@mcp.tool()
async def get_weather(location: str, units: str = "metric") -> str:
    """특정 위치의 현재 날씨 정보를 조회합니다."""
    # Geocoding to get coordinates
    async with httpx.AsyncClient() as client:
        geo_resp = await client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": location, "count": 1}
        )
        geo_data = geo_resp.json()

        if not geo_data.get("results"):
            return f"Location '{location}' not found"

        lat = geo_data["results"][0]["latitude"]
        lon = geo_data["results"][0]["longitude"]
        name = geo_data["results"][0]["name"]

        # Get current weather
        weather_resp = await client.get(
            f"{WEATHER_API_BASE}/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current_weather": True,
                "temperature_unit": "celsius" if units == "metric" else "fahrenheit"
            }
        )
        weather = weather_resp.json()["current_weather"]

        temp_unit = "C" if units == "metric" else "F"
        return f"Weather in {name}: {weather['temperature']}{temp_unit}, Wind: {weather['windspeed']} km/h"

@mcp.tool()
async def get_forecast(location: str, days: int = 3) -> str:
    """특정 위치의 날씨 예보를 조회합니다."""
    async with httpx.AsyncClient() as client:
        geo_resp = await client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": location, "count": 1}
        )
        geo_data = geo_resp.json()

        if not geo_data.get("results"):
            return f"Location '{location}' not found"

        lat = geo_data["results"][0]["latitude"]
        lon = geo_data["results"][0]["longitude"]
        name = geo_data["results"][0]["name"]

        weather_resp = await client.get(
            f"{WEATHER_API_BASE}/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                "forecast_days": min(days, 7)
            }
        )
        daily = weather_resp.json()["daily"]

        forecasts = []
        for i in range(len(daily["time"])):
            forecasts.append(
                f"{daily['time'][i]}: {daily['temperature_2m_min'][i]}C - {daily['temperature_2m_max'][i]}C, "
                f"Rain: {daily['precipitation_sum'][i]}mm"
            )

        return f"Forecast for {name}:\\n" + "\\n".join(forecasts)

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
`,
      requirements: `mcp>=1.0.0
fastmcp>=0.4.0
httpx>=0.27.0`,
    },
    defaultEnv: {},
  },
  {
    id: "slack",
    name: "Slack",
    description: "Slack 채널에 메시지 전송 및 채널 목록 조회",
    icon: "MessageSquare",
    category: "communication",
    tools: [
      {
        name: "send_message",
        description: "Slack 채널에 메시지를 전송합니다",
        inputSchema: {
          type: "object",
          properties: {
            channel: { type: "string", description: "채널 ID 또는 이름" },
            message: { type: "string", description: "전송할 메시지" },
          },
          required: ["channel", "message"],
        },
      },
      {
        name: "list_channels",
        description: "접근 가능한 Slack 채널 목록을 조회합니다",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "최대 조회 개수", default: 20 },
          },
        },
      },
    ],
    code: {
      mainPy: `from mcp.server.fastmcp import FastMCP
import httpx
import os

mcp = FastMCP("slack-tools")

SLACK_TOKEN = os.getenv("SLACK_BOT_TOKEN", "")

@mcp.tool()
async def send_message(channel: str, message: str) -> str:
    """Slack 채널에 메시지를 전송합니다."""
    if not SLACK_TOKEN:
        return "Error: SLACK_BOT_TOKEN environment variable not set"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://slack.com/api/chat.postMessage",
            headers={"Authorization": f"Bearer {SLACK_TOKEN}"},
            json={"channel": channel, "text": message}
        )
        data = resp.json()

        if data.get("ok"):
            return f"Message sent to {channel} successfully"
        return f"Error: {data.get('error', 'Unknown error')}"

@mcp.tool()
async def list_channels(limit: int = 20) -> str:
    """접근 가능한 Slack 채널 목록을 조회합니다."""
    if not SLACK_TOKEN:
        return "Error: SLACK_BOT_TOKEN environment variable not set"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://slack.com/api/conversations.list",
            headers={"Authorization": f"Bearer {SLACK_TOKEN}"},
            params={"limit": limit, "types": "public_channel,private_channel"}
        )
        data = resp.json()

        if not data.get("ok"):
            return f"Error: {data.get('error', 'Unknown error')}"

        channels = data.get("channels", [])
        result = [f"#{ch['name']} ({ch['id']})" for ch in channels]
        return "Channels:\\n" + "\\n".join(result)

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
`,
      requirements: `mcp>=1.0.0
fastmcp>=0.4.0
httpx>=0.27.0`,
    },
    defaultEnv: {
      SLACK_BOT_TOKEN: "",
    },
  },
  {
    id: "github",
    name: "GitHub",
    description: "GitHub 저장소 관리 및 이슈 생성",
    icon: "Github",
    category: "data",
    tools: [
      {
        name: "create_issue",
        description: "GitHub 저장소에 이슈를 생성합니다",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string", description: "저장소 소유자" },
            repo: { type: "string", description: "저장소 이름" },
            title: { type: "string", description: "이슈 제목" },
            body: { type: "string", description: "이슈 내용" },
          },
          required: ["owner", "repo", "title"],
        },
      },
      {
        name: "list_repos",
        description: "사용자의 GitHub 저장소 목록을 조회합니다",
        inputSchema: {
          type: "object",
          properties: {
            username: { type: "string", description: "GitHub 사용자명 (없으면 인증된 사용자)" },
            limit: { type: "number", description: "최대 조회 개수", default: 10 },
          },
        },
      },
    ],
    code: {
      mainPy: `from mcp.server.fastmcp import FastMCP
import httpx
import os

mcp = FastMCP("github-tools")

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_API = "https://api.github.com"

def get_headers():
    headers = {"Accept": "application/vnd.github+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers

@mcp.tool()
async def create_issue(owner: str, repo: str, title: str, body: str = "") -> str:
    """GitHub 저장소에 이슈를 생성합니다."""
    if not GITHUB_TOKEN:
        return "Error: GITHUB_TOKEN environment variable not set"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{GITHUB_API}/repos/{owner}/{repo}/issues",
            headers=get_headers(),
            json={"title": title, "body": body}
        )

        if resp.status_code == 201:
            data = resp.json()
            return f"Issue created: {data['html_url']}"
        return f"Error: {resp.status_code} - {resp.text}"

@mcp.tool()
async def list_repos(username: str = "", limit: int = 10) -> str:
    """사용자의 GitHub 저장소 목록을 조회합니다."""
    async with httpx.AsyncClient() as client:
        if username:
            url = f"{GITHUB_API}/users/{username}/repos"
        else:
            url = f"{GITHUB_API}/user/repos"

        resp = await client.get(
            url,
            headers=get_headers(),
            params={"per_page": limit, "sort": "updated"}
        )

        if resp.status_code != 200:
            return f"Error: {resp.status_code} - {resp.text}"

        repos = resp.json()
        result = [f"- {r['full_name']}: {r.get('description', 'No description')}" for r in repos]
        return "Repositories:\\n" + "\\n".join(result)

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
`,
      requirements: `mcp>=1.0.0
fastmcp>=0.4.0
httpx>=0.27.0`,
    },
    defaultEnv: {
      GITHUB_TOKEN: "",
    },
  },
  {
    id: "database",
    name: "Database",
    description: "PostgreSQL 데이터베이스 쿼리 실행 및 테이블 조회",
    icon: "Database",
    category: "data",
    tools: [
      {
        name: "execute_query",
        description: "SQL 쿼리를 실행합니다 (SELECT만 허용)",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "실행할 SQL 쿼리 (SELECT만)" },
          },
          required: ["query"],
        },
      },
      {
        name: "list_tables",
        description: "데이터베이스의 테이블 목록을 조회합니다",
        inputSchema: {
          type: "object",
          properties: {
            schema: { type: "string", description: "스키마 이름", default: "public" },
          },
        },
      },
    ],
    code: {
      mainPy: `from mcp.server.fastmcp import FastMCP
import asyncpg
import os
import json

mcp = FastMCP("database-tools")

DATABASE_URL = os.getenv("DATABASE_URL", "")

async def get_connection():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable not set")
    return await asyncpg.connect(DATABASE_URL)

@mcp.tool()
async def execute_query(query: str) -> str:
    """SQL 쿼리를 실행합니다 (SELECT만 허용)."""
    # Security: Only allow SELECT queries
    query_upper = query.strip().upper()
    if not query_upper.startswith("SELECT"):
        return "Error: Only SELECT queries are allowed for security reasons"

    try:
        conn = await get_connection()
        try:
            rows = await conn.fetch(query)
            if not rows:
                return "No results found"

            # Convert to list of dicts
            results = [dict(row) for row in rows]
            return json.dumps(results, indent=2, default=str)
        finally:
            await conn.close()
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
async def list_tables(schema: str = "public") -> str:
    """데이터베이스의 테이블 목록을 조회합니다."""
    try:
        conn = await get_connection()
        try:
            rows = await conn.fetch('''
                SELECT table_name,
                       (SELECT count(*) FROM information_schema.columns
                        WHERE table_schema = $1 AND table_name = t.table_name) as column_count
                FROM information_schema.tables t
                WHERE table_schema = $1
                ORDER BY table_name
            ''', schema)

            if not rows:
                return f"No tables found in schema '{schema}'"

            result = [f"- {row['table_name']} ({row['column_count']} columns)" for row in rows]
            return f"Tables in schema '{schema}':\\n" + "\\n".join(result)
        finally:
            await conn.close()
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
`,
      requirements: `mcp>=1.0.0
fastmcp>=0.4.0
asyncpg>=0.29.0`,
    },
    defaultEnv: {
      DATABASE_URL: "postgresql://user:password@localhost:5432/dbname",
    },
  },
  {
    id: "s3-files",
    name: "S3 Files",
    description: "AWS S3 버킷 파일 업로드 및 다운로드",
    icon: "FileCloud",
    category: "cloud",
    tools: [
      {
        name: "upload_file",
        description: "파일을 S3에 업로드합니다",
        inputSchema: {
          type: "object",
          properties: {
            bucket: { type: "string", description: "S3 버킷 이름" },
            key: { type: "string", description: "S3 객체 키 (경로)" },
            content: { type: "string", description: "업로드할 파일 내용 (텍스트)" },
          },
          required: ["bucket", "key", "content"],
        },
      },
      {
        name: "download_file",
        description: "S3에서 파일을 다운로드합니다",
        inputSchema: {
          type: "object",
          properties: {
            bucket: { type: "string", description: "S3 버킷 이름" },
            key: { type: "string", description: "S3 객체 키 (경로)" },
          },
          required: ["bucket", "key"],
        },
      },
      {
        name: "list_files",
        description: "S3 버킷의 파일 목록을 조회합니다",
        inputSchema: {
          type: "object",
          properties: {
            bucket: { type: "string", description: "S3 버킷 이름" },
            prefix: { type: "string", description: "접두사 (폴더 경로)", default: "" },
          },
          required: ["bucket"],
        },
      },
    ],
    code: {
      mainPy: `from mcp.server.fastmcp import FastMCP
import boto3
import os

mcp = FastMCP("s3-tools")

def get_s3_client():
    return boto3.client(
        "s3",
        region_name=os.getenv("AWS_REGION", "us-east-1")
    )

@mcp.tool()
def upload_file(bucket: str, key: str, content: str) -> str:
    """파일을 S3에 업로드합니다."""
    try:
        s3 = get_s3_client()
        s3.put_object(Bucket=bucket, Key=key, Body=content.encode("utf-8"))
        return f"Successfully uploaded to s3://{bucket}/{key}"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def download_file(bucket: str, key: str) -> str:
    """S3에서 파일을 다운로드합니다."""
    try:
        s3 = get_s3_client()
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response["Body"].read().decode("utf-8")
        return content
    except s3.exceptions.NoSuchKey:
        return f"Error: File not found - s3://{bucket}/{key}"
    except Exception as e:
        return f"Error: {str(e)}"

@mcp.tool()
def list_files(bucket: str, prefix: str = "") -> str:
    """S3 버킷의 파일 목록을 조회합니다."""
    try:
        s3 = get_s3_client()
        response = s3.list_objects_v2(Bucket=bucket, Prefix=prefix, MaxKeys=50)

        if "Contents" not in response:
            return f"No files found in s3://{bucket}/{prefix}"

        files = []
        for obj in response["Contents"]:
            size_kb = obj["Size"] / 1024
            files.append(f"- {obj['Key']} ({size_kb:.1f} KB)")

        return f"Files in s3://{bucket}/{prefix}:\\n" + "\\n".join(files)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
`,
      requirements: `mcp>=1.0.0
fastmcp>=0.4.0
boto3>=1.34.0`,
    },
    defaultEnv: {
      AWS_REGION: "us-east-1",
    },
  },
];

// AWS Core MCP Server configuration
export const AWS_CORE_MCP_ROLES = [
  { id: "solutions-architect", name: "Solutions Architect", description: "AWS 아키텍처 설계 지원" },
  { id: "software-developer", name: "Software Developer", description: "AWS SDK 및 개발 지원" },
  { id: "devops-engineer", name: "DevOps Engineer", description: "CI/CD 및 인프라 자동화" },
  { id: "data-engineer", name: "Data Engineer", description: "데이터 파이프라인 설계" },
  { id: "security-engineer", name: "Security Engineer", description: "보안 모범 사례" },
];

export function getAWSCoreMCPConfig(role: string): MCPServerConfig {
  return {
    command: "uvx",
    args: ["awslabs.core-mcp-server@latest"],
    env: {
      AWS_MCP_ROLE: role,
    },
  };
}

// Helper to get template by ID
export function getMCPTemplate(templateId: string): MCPTemplate | undefined {
  return MCP_TEMPLATES.find((t) => t.id === templateId);
}
