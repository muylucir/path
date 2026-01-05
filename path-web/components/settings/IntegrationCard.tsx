"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Server, Database, Pencil, Trash2 } from "lucide-react";
import type { IntegrationListItem } from "@/lib/types";

interface IntegrationCardProps {
  integration: IntegrationListItem;
  onEdit: () => void;
  onDelete: () => void;
}

const typeConfig = {
  api: {
    icon: Globe,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    label: "API",
  },
  mcp: {
    icon: Server,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    label: "MCP",
  },
  rag: {
    icon: Database,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    label: "RAG",
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-md ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <CardTitle className="text-base">{integration.name}</CardTitle>
          </div>
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
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
