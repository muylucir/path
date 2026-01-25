"use client";

import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  Filter,
} from "lucide-react";
import type { DeploymentLog } from "@/lib/types";

interface LogViewerProps {
  deploymentId: string;
  maxHeight?: string;
}

export function LogViewer({ deploymentId, maxHeight = "400px" }: LogViewerProps) {
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLogs();

    // 자동 새로고침 (2초마다)
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadLogs, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deploymentId, levelFilter, stageFilter, autoRefresh]);

  useEffect(() => {
    // 새 로그가 추가되면 스크롤
    if (autoRefresh) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoRefresh]);

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (levelFilter !== "all") params.append("level", levelFilter);
      if (stageFilter !== "all") params.append("stage", stageFilter);

      const response = await fetch(
        `/api/bedrock/deployments/${deploymentId}/logs?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      default:
        return <Info className="h-3 w-3 text-blue-500" />;
    }
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      default:
        return "secondary";
    }
  };

  const getStageBadgeVariant = (stage: string) => {
    switch (stage) {
      case "build":
        return "secondary";
      case "push":
        return "default";
      case "deploy":
        return "success";
      case "runtime":
        return "default";
      default:
        return "secondary";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue placeholder="레벨" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 레벨</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue placeholder="단계" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 단계</SelectItem>
            <SelectItem value="build">Build</SelectItem>
            <SelectItem value="push">Push</SelectItem>
            <SelectItem value="deploy">Deploy</SelectItem>
            <SelectItem value="runtime">Runtime</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button
          variant={autoRefresh ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
          {autoRefresh ? "자동" : "수동"}
        </Button>

        {!autoRefresh && (
          <Button variant="outline" size="sm" onClick={loadLogs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            새로고침
          </Button>
        )}
      </div>

      {/* Log List */}
      <div
        className="bg-muted/50 rounded-lg p-2 overflow-y-auto font-mono text-xs"
        style={{ maxHeight }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            로그가 없습니다
          </div>
        ) : (
          <div className="space-y-1">
            {/* 오래된 것부터 표시 (역순) */}
            {[...logs].reverse().map((log, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-1.5 rounded ${
                  log.level === "error"
                    ? "bg-destructive/10"
                    : log.level === "warning"
                    ? "bg-yellow-500/10"
                    : ""
                }`}
              >
                <span className="text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className="flex items-center gap-1">
                  {getLevelIcon(log.level)}
                </span>
                <Badge
                  variant={getStageBadgeVariant(log.stage) as any}
                  className="text-[10px] px-1 py-0"
                >
                  {log.stage}
                </Badge>
                <span
                  className={`flex-1 break-all ${
                    log.level === "error"
                      ? "text-destructive"
                      : log.level === "warning"
                      ? "text-yellow-600 dark:text-yellow-400"
                      : ""
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>총 {logs.length}개 로그</span>
        <span className="text-destructive">
          {logs.filter((l) => l.level === "error").length} errors
        </span>
        <span className="text-yellow-600">
          {logs.filter((l) => l.level === "warning").length} warnings
        </span>
      </div>
    </div>
  );
}
