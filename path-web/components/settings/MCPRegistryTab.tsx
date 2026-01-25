"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Blocks,
  Code,
  Search,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Rocket,
  FileText,
  Play,
  RefreshCw,
} from "lucide-react";
import type {
  IntegrationListItem,
  MCPTemplate,
} from "@/lib/types";
import { MCPServerForm } from "./MCPServerForm";
import { MCPPlaygroundDrawer } from "./MCPPlaygroundDrawer";

interface DeploymentLog {
  timestamp: number;
  level: string;
  stage: string;
  message: string;
}

type SubTabType = "templates" | "self-hosted";

export function MCPRegistryTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("templates");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Templates state
  const [templates, setTemplates] = useState<MCPTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // My servers state
  const [myServers, setMyServers] = useState<IntegrationListItem[]>([]);
  const [myServersLoading, setMyServersLoading] = useState(false);

  // Template-installed servers state
  const [templateServers, setTemplateServers] = useState<IntegrationListItem[]>([]);
  const [templateServersLoading, setTemplateServersLoading] = useState(false);

  // Deployment progress state
  const [deployingServers, setDeployingServers] = useState<Set<string>>(new Set());
  const [deploymentProgress, setDeploymentProgress] = useState<Record<string, number>>({});
  const pollingRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Log viewer state
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const [selectedLogServerId, setSelectedLogServerId] = useState<string | null>(null);
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const logStreamRef = useRef<EventSource | null>(null);

  // Playground drawer state
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [playgroundServerId, setPlaygroundServerId] = useState<string | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Fetch my servers when tab changes
  useEffect(() => {
    if (activeSubTab === "self-hosted") {
      fetchMyServers();
    }
  }, [activeSubTab, refreshKey]);

  // Fetch template servers when templates tab is active
  useEffect(() => {
    if (activeSubTab === "templates") {
      fetchTemplateServers();
    }
  }, [activeSubTab, refreshKey]);

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await fetch("/api/mcp-servers/templates");
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const fetchTemplateServers = async () => {
    setTemplateServersLoading(true);
    try {
      const response = await fetch("/api/mcp-servers?sourceType=template");
      const data = await response.json();
      if (data.success) {
        setTemplateServers(data.servers || []);
      }
    } catch (error) {
      console.error("Failed to fetch template servers:", error);
    } finally {
      setTemplateServersLoading(false);
    }
  };

  const fetchMyServers = async () => {
    setMyServersLoading(true);
    try {
      // "내 서버" 탭: AgentCore 배포 가능한 서버만 표시 (self-hosted, template)
      // external, aws 타입은 stdio 기반이므로 AgentCore Runtime에서 실행 불가
      const response = await fetch("/api/mcp-servers");
      const data = await response.json();
      if (data.success) {
        const userServers = (data.servers || []).filter(
          (s: IntegrationListItem) =>
            s.mcpSourceType === "self-hosted" ||
            s.mcpSourceType === "template"
        );
        setMyServers(userServers);
      }
    } catch (error) {
      console.error("Failed to fetch servers:", error);
    } finally {
      setMyServersLoading(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRef.current).forEach((timer) => clearTimeout(timer));
      if (logStreamRef.current) {
        logStreamRef.current.close();
      }
    };
  }, []);

  // Start deployment status polling
  const startDeploymentPolling = useCallback((serverId: string) => {
    setDeployingServers((prev) => new Set([...prev, serverId]));
    setDeploymentProgress((prev) => ({ ...prev, [serverId]: 10 }));

    const poll = async () => {
      try {
        const response = await fetch(`/api/mcp-servers/${serverId}/deploy`);
        const data = await response.json();

        if (data.success) {
          const status = data.deployment?.status;
          const progress = data.deployment?.progress || 0;

          // Update progress (estimate based on status if not provided)
          setDeploymentProgress((prev) => ({
            ...prev,
            [serverId]: progress || (status === "deploying" ? Math.min((prev[serverId] || 10) + 5, 90) : 100),
          }));

          if (status === "ready" || status === "failed") {
            // Stop polling
            setDeployingServers((prev) => {
              const next = new Set(prev);
              next.delete(serverId);
              return next;
            });
            if (pollingRef.current[serverId]) {
              clearTimeout(pollingRef.current[serverId]);
              delete pollingRef.current[serverId];
            }
            // Refresh the list
            setRefreshKey((k) => k + 1);
          } else {
            // Continue polling
            pollingRef.current[serverId] = setTimeout(poll, 3000);
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        // Continue polling on error
        pollingRef.current[serverId] = setTimeout(poll, 5000);
      }
    };

    poll();
  }, []);

  // Open log viewer
  const handleViewLogs = useCallback(async (serverId: string) => {
    setSelectedLogServerId(serverId);
    setIsLogViewerOpen(true);
    setLogsLoading(true);
    setLogs([]);

    try {
      // Fetch existing logs
      const response = await fetch(`/api/mcp-servers/${serverId}/logs?limit=100`);
      const data = await response.json();
      if (data.success && data.logs) {
        setLogs(data.logs.reverse()); // oldest first
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLogsLoading(false);
    }

    // Start streaming new logs if currently deploying
    if (deployingServers.has(serverId)) {
      try {
        const eventSource = new EventSource(`/api/mcp-servers/${serverId}/logs?stream=true`);
        logStreamRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const logData = JSON.parse(event.data);
            if (logData.type !== "heartbeat" && logData.message) {
              setLogs((prev) => [...prev, logData]);
            }
          } catch {
            // Ignore parse errors
          }
        };

        eventSource.onerror = () => {
          eventSource.close();
          logStreamRef.current = null;
        };
      } catch (error) {
        console.error("Failed to start log stream:", error);
      }
    }
  }, [deployingServers]);

  // Close log viewer
  const handleCloseLogViewer = useCallback(() => {
    setIsLogViewerOpen(false);
    setSelectedLogServerId(null);
    setLogs([]);
    if (logStreamRef.current) {
      logStreamRef.current.close();
      logStreamRef.current = null;
    }
  }, []);

  // Open playground drawer
  const handleOpenPlayground = useCallback((serverId: string) => {
    setPlaygroundServerId(serverId);
    setIsPlaygroundOpen(true);
  }, []);

  const handleInstallTemplate = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setSelectedTemplateId(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    // Find server to check deployment status
    const server = myServers.find(s => s.id === id);
    const hasRuntime = server?.mcpDeploymentStatus === 'ready';

    const confirmMessage = hasRuntime
      ? "이 MCP 서버와 AgentCore Runtime을 함께 삭제하시겠습니까?"
      : "정말 삭제하시겠습니까?";

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/mcp-servers/${id}`, { method: "DELETE" });
      const result = await response.json();

      if (result.success) {
        // Show runtime deletion status
        if (hasRuntime) {
          if (result.runtimeDeleted) {
            console.log("✅ MCP 서버와 Runtime이 삭제되었습니다");
          } else if (result.warning) {
            alert(`⚠️ MCP 서버는 삭제되었지만 Runtime 삭제에 문제가 있었습니다:\n${result.warning}`);
          }
        }
        setRefreshKey((k) => k + 1);
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("삭제에 실패했습니다");
    }
  };

  const handleDeploy = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp-servers/${id}/deploy`, {
        method: "POST",
      });

      if (response.ok) {
        // Start polling for deployment progress
        startDeploymentPolling(id);
        setRefreshKey((k) => k + 1);
      } else {
        const data = await response.json();
        alert(`배포 실패: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to deploy:", error);
      alert("배포에 실패했습니다");
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setSelectedTemplateId(null);
  };

  const handleFormSaved = () => {
    handleFormClose();
    setRefreshKey((k) => k + 1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by filtering in-memory for templates and my servers
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="MCP 서버 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">검색</Button>
      </form>

      {/* Sub Tabs */}
      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as SubTabType)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-1.5">
            <Blocks className="w-4 h-4" />
            템플릿
          </TabsTrigger>
          <TabsTrigger value="self-hosted" className="flex items-center gap-1.5">
            <Code className="w-4 h-4" />
            내 서버
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6 space-y-8">
          {/* Available Templates Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                미리 준비된 MCP 서버 템플릿을 선택하여 커스터마이징 후 배포하세요
              </p>
            </div>

            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleInstallTemplate(template.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900 dark:to-blue-900 rounded-lg flex items-center justify-center">
                        <Code className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <h3 className="font-medium mb-1">{template.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="mt-3">
                        <Button size="sm" variant="outline" className="w-full">
                          설치
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Installed Template Servers Section */}
          {templateServersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : templateServers.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-base">설치된 템플릿 서버</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    템플릿에서 생성된 MCP 서버 목록입니다
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templateServers.map((server) => {
                  const isDeploying = deployingServers.has(server.id) || server.mcpDeploymentStatus === "deploying";
                  const progress = deploymentProgress[server.id] || 0;

                  return (
                    <Card key={server.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-md bg-gradient-to-br from-cyan-100 to-blue-100 text-cyan-700 dark:from-cyan-900 dark:to-blue-900 dark:text-cyan-300">
                              <Blocks className="w-4 h-4" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{server.name}</CardTitle>
                              {server.mcpToolCount !== undefined && (
                                <p className="text-xs text-slate-500">
                                  {server.mcpToolCount}개 도구
                                </p>
                              )}
                            </div>
                          </div>
                          {server.mcpDeploymentStatus && (
                            <Badge
                              variant="outline"
                              className={
                                server.mcpDeploymentStatus === "ready"
                                  ? "bg-green-100 text-green-700"
                                  : isDeploying
                                  ? "bg-yellow-100 text-yellow-700"
                                  : server.mcpDeploymentStatus === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-700"
                              }
                            >
                              {server.mcpDeploymentStatus === "ready" ? "Ready" :
                               isDeploying ? "배포 중" :
                               server.mcpDeploymentStatus === "failed" ? "실패" : "대기 중"}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {server.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {server.description}
                          </p>
                        )}

                        {/* Progress bar for deploying servers */}
                        {isDeploying && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">배포 진행률</span>
                              <span className="text-xs text-slate-500">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          {/* Left: Playground & Logs buttons */}
                          <div className="flex gap-1">
                            {server.mcpDeploymentStatus === "ready" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenPlayground(server.id)}
                                className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                테스트
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewLogs(server.id)}
                              className="h-8 px-2"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              로그
                            </Button>
                          </div>

                          {/* Right: Deploy, Edit, Delete */}
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeploy(server.id)}
                              className="h-8 px-2"
                              disabled={isDeploying}
                            >
                              {isDeploying ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Rocket className="w-4 h-4 mr-1" />
                              )}
                              {isDeploying ? "배포 중" : "배포"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(server.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(server.id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}
        </TabsContent>

        {/* Self-hosted Tab */}
        <TabsContent value="self-hosted" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AgentCore Runtime에 배포 가능한 MCP 서버 목록입니다
              </p>
              <p className="text-xs text-slate-400 mt-1">
                직접 생성하거나 템플릿에서 커스터마이징한 서버만 배포할 수 있습니다
              </p>
            </div>
            <Button onClick={() => {
              setSelectedTemplateId(null);
              setEditingId(null);
              setIsFormOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              새 서버 만들기
            </Button>
          </div>

          {myServersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : myServers.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
              <Code className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">등록된 서버가 없습니다</p>
              <p className="text-sm text-slate-400 mt-1">
                &quot;새 서버 만들기&quot; 버튼을 눌러 MCP 서버를 생성하세요
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myServers.map((server) => {
                // 소스 타입에 따른 스타일 (AgentCore 배포 가능한 것만)
                const sourceStyles = {
                  "self-hosted": { bg: "bg-cyan-100 dark:bg-cyan-900", text: "text-cyan-700 dark:text-cyan-300", icon: Code, label: "직접 생성", deployable: true },
                  "template": { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", icon: Blocks, label: "템플릿", deployable: true },
                };
                const style = sourceStyles[server.mcpSourceType as keyof typeof sourceStyles] || sourceStyles["self-hosted"];
                const IconComponent = style.icon;
                const isDeploying = deployingServers.has(server.id) || server.mcpDeploymentStatus === "deploying";
                const progress = deploymentProgress[server.id] || 0;

                return (
                <Card key={server.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-md ${style.bg} ${style.text}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{server.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            {server.mcpToolCount !== undefined && (
                              <p className="text-xs text-slate-500">
                                {server.mcpToolCount}개 도구
                              </p>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {style.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {server.mcpDeploymentStatus && (
                        <Badge
                          variant="outline"
                          className={
                            server.mcpDeploymentStatus === "ready"
                              ? "bg-green-100 text-green-700"
                              : isDeploying
                              ? "bg-yellow-100 text-yellow-700"
                              : server.mcpDeploymentStatus === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {server.mcpDeploymentStatus === "ready" ? "Ready" :
                           isDeploying ? "배포 중" :
                           server.mcpDeploymentStatus === "failed" ? "실패" : "대기 중"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {server.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {server.description}
                      </p>
                    )}

                    {/* Progress bar for deploying servers */}
                    {isDeploying && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">배포 진행률</span>
                          <span className="text-xs text-slate-500">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Left: Playground & Logs buttons */}
                      <div className="flex gap-1">
                        {server.mcpDeploymentStatus === "ready" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenPlayground(server.id)}
                            className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            테스트
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLogs(server.id)}
                          className="h-8 px-2"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          로그
                        </Button>
                      </div>

                      {/* Right: Deploy, Edit, Delete */}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeploy(server.id)}
                          className="h-8 px-2"
                          disabled={isDeploying}
                        >
                          {isDeploying ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Rocket className="w-4 h-4 mr-1" />
                          )}
                          {isDeploying ? "배포 중" : "배포"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(server.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(server.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Drawer */}
      <Drawer direction="right" open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DrawerContent className="h-full w-full sm:max-w-4xl">
          <DrawerHeader className="border-b">
            <DrawerTitle>
              {editingId ? "MCP 서버 수정" : selectedTemplateId ? "템플릿에서 설치" : "새 MCP 서버 만들기"}
            </DrawerTitle>
            <DrawerDescription>MCP 서버 설정을 구성합니다</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-auto p-6">
            <MCPServerForm
              serverId={editingId}
              templateId={selectedTemplateId}
              onSaved={handleFormSaved}
              onCancel={handleFormClose}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Log Viewer Drawer */}
      <Drawer direction="right" open={isLogViewerOpen} onOpenChange={(open) => !open && handleCloseLogViewer()}>
        <DrawerContent className="h-full w-full sm:max-w-2xl">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle>배포 로그</DrawerTitle>
                <DrawerDescription>
                  {selectedLogServerId ? `MCP 서버 배포 로그` : "로그"}
                </DrawerDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selectedLogServerId && handleViewLogs(selectedLogServerId)}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-auto p-4">
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                로그가 없습니다
              </div>
            ) : (
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, idx) => {
                  const timestamp = new Date(log.timestamp * 1000).toLocaleTimeString();
                  const levelColor =
                    log.level === "error"
                      ? "text-red-600"
                      : log.level === "warning"
                      ? "text-yellow-600"
                      : "text-slate-600";
                  const stageColor =
                    log.stage === "build"
                      ? "text-blue-600"
                      : log.stage === "push"
                      ? "text-purple-600"
                      : log.stage === "deploy"
                      ? "text-green-600"
                      : "text-slate-500";

                  return (
                    <div
                      key={idx}
                      className={`flex gap-2 ${
                        log.level === "error" ? "bg-red-50 dark:bg-red-900/20 p-1 rounded" : ""
                      }`}
                    >
                      <span className="text-slate-400 shrink-0">{timestamp}</span>
                      <span className={`${stageColor} shrink-0 w-14`}>[{log.stage}]</span>
                      <span className={levelColor}>{log.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Playground Drawer */}
      <MCPPlaygroundDrawer
        serverId={playgroundServerId}
        open={isPlaygroundOpen}
        onOpenChange={setIsPlaygroundOpen}
      />
    </div>
  );
}
