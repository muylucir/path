"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Copy,
  Terminal,
  Cloud,
  Server,
  Shield,
  Database,
  Link,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import type { AgentCanvasState } from "@/lib/types";

interface DeployPanelProps {
  canvasState: AgentCanvasState;
}

export function DeployPanel({ canvasState }: DeployPanelProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const agentCount = canvasState.nodes.filter((n) => n.type === "agent").length;
  const hasMemory = canvasState.nodes.some((n) => n.type === "memory");
  const hasGateway = canvasState.nodes.some((n) => n.type === "gateway");
  const hasIdentity = canvasState.nodes.some((n) => n.type === "identity");

  const deployCommands = [
    {
      id: "init",
      title: "1. 프로젝트 초기화",
      command: `mkdir my-agent-project && cd my-agent-project
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt`,
    },
    {
      id: "config",
      title: "2. AWS 자격 증명 설정",
      command: `aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: us-east-1`,
    },
    {
      id: "test",
      title: "3. 로컬 테스트",
      command: `python agent.py`,
    },
    {
      id: "deploy",
      title: "4. AgentCore Runtime 배포",
      command: `# AgentCore CLI 설치
pip install bedrock-agentcore-cli

# 배포
agentcore deploy --name my-agent --entry agentcore_config.py`,
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-2">AgentCore 배포 가이드</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          생성된 코드를 Amazon Bedrock AgentCore Runtime에 배포하는 방법입니다.
        </p>
      </div>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            배포 구성 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Cloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Runtime</p>
                <p className="font-medium">{agentCount} Agents</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  hasMemory
                    ? "bg-purple-100 dark:bg-purple-900"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Database
                  className={`h-4 w-4 ${
                    hasMemory
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Memory</p>
                <p className="font-medium">{hasMemory ? "활성화" : "미사용"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  hasGateway
                    ? "bg-emerald-100 dark:bg-emerald-900"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Link
                  className={`h-4 w-4 ${
                    hasGateway
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Gateway</p>
                <p className="font-medium">{hasGateway ? "활성화" : "미사용"}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  hasIdentity
                    ? "bg-red-100 dark:bg-red-900"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Shield
                  className={`h-4 w-4 ${
                    hasIdentity
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-xs text-gray-500">Identity</p>
                <p className="font-medium">{hasIdentity ? "활성화" : "미사용"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            사전 요구사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Python 3.11 이상 설치
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              AWS CLI 설치 및 구성
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              Bedrock 모델 액세스 권한 (Claude Sonnet/Haiku 4.5)
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              AgentCore 서비스 액세스 권한
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Deploy Commands */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          배포 명령어
        </h3>

        {deployCommands.map((cmd) => (
          <Card key={cmd.id}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{cmd.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(cmd.command, cmd.id)}
                  className="gap-2"
                >
                  {copied === cmd.id ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      복사
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs overflow-x-auto">
                <code>{cmd.command}</code>
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Important Notes */}
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertTriangle className="h-4 w-4" />
            주의사항
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
            <li>• AgentCore Runtime은 AWS 리전별로 가용성이 다릅니다.</li>
            <li>• 배포 전 AWS 비용을 확인하세요 (Runtime, Bedrock API 호출).</li>
            <li>• 프로덕션 배포 전 로컬 테스트를 권장합니다.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Info className="h-4 w-4" />
            도움말
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            자세한 AgentCore 사용법은{" "}
            <a
              href="https://docs.aws.amazon.com/bedrock/latest/userguide/agents-core.html"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              AWS 문서
            </a>
            를 참고하세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
