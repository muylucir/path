"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, Key, Database, HardDrive, Pencil, Trash2, Server } from "lucide-react";
import type { IntegrationListItem, IntegrationType } from "@/lib/types";

interface IntegrationCardProps {
  integration: IntegrationListItem;
  onEdit: () => void;
  onDelete: () => void;
}

const typeConfig: Record<IntegrationType, { icon: typeof Network; color: string; label: string }> = {
  gateway: {
    icon: Network,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    label: "Gateway",
  },
  identity: {
    icon: Key,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    label: "Identity",
  },
  rag: {
    icon: Database,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    label: "RAG",
  },
  s3: {
    icon: HardDrive,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    label: "S3",
  },
  "mcp-server": {
    icon: Server,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
    label: "MCP Server",
  },
};

export function IntegrationCard({
  integration,
  onEdit,
  onDelete,
}: IntegrationCardProps) {
  const config = typeConfig[integration.type];
  const Icon = config.icon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = () => {
    if (integration.type === "gateway" && integration.gatewayStatus) {
      const statusColors = {
        creating: "bg-yellow-100 text-yellow-700",
        ready: "bg-green-100 text-green-700",
        failed: "bg-red-100 text-red-700",
      };
      return (
        <Badge variant="outline" className={statusColors[integration.gatewayStatus]}>
          {integration.gatewayStatus === "ready" ? "Ready" :
           integration.gatewayStatus === "creating" ? "생성 중" : "실패"}
        </Badge>
      );
    }
    if (integration.type === "identity" && integration.providerStatus) {
      const statusColors = {
        creating: "bg-yellow-100 text-yellow-700",
        active: "bg-green-100 text-green-700",
        failed: "bg-red-100 text-red-700",
      };
      return (
        <Badge variant="outline" className={statusColors[integration.providerStatus]}>
          {integration.providerStatus === "active" ? "Active" :
           integration.providerStatus === "creating" ? "생성 중" : "실패"}
        </Badge>
      );
    }
    if (integration.type === "mcp-server" && integration.mcpDeploymentStatus) {
      const statusColors: Record<string, string> = {
        pending: "bg-slate-100 text-slate-700",
        deploying: "bg-yellow-100 text-yellow-700",
        ready: "bg-green-100 text-green-700",
        failed: "bg-red-100 text-red-700",
      };
      const statusLabels: Record<string, string> = {
        pending: "대기 중",
        deploying: "배포 중",
        ready: "Ready",
        failed: "실패",
      };
      return (
        <Badge variant="outline" className={statusColors[integration.mcpDeploymentStatus]}>
          {statusLabels[integration.mcpDeploymentStatus]}
        </Badge>
      );
    }
    return null;
  };

  const getSubtitle = () => {
    if (integration.type === "gateway" && integration.targetCount !== undefined) {
      return `${integration.targetCount}개 Target`;
    }
    if (integration.type === "identity" && integration.providerType) {
      return integration.providerType === "api-key" ? "API Key" : "OAuth 2.0";
    }
    if (integration.type === "mcp-server") {
      const sourceLabels: Record<string, string> = {
        "self-hosted": "Self-hosted",
        "template": "Template",
        "external": "External",
        "aws": "AWS MCP",
        "team": "Team Shared",
      };
      const parts: string[] = [];
      if (integration.mcpSourceType) {
        parts.push(sourceLabels[integration.mcpSourceType] || integration.mcpSourceType);
      }
      if (integration.mcpToolCount !== undefined) {
        parts.push(`${integration.mcpToolCount}개 도구`);
      }
      return parts.length > 0 ? parts.join(" · ") : null;
    }
    return null;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-md ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base">{integration.name}</CardTitle>
              {getSubtitle() && (
                <p className="text-xs text-slate-500">{getSubtitle()}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
            {getStatusBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {integration.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
            {integration.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {formatDate(integration.createdAt)}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
