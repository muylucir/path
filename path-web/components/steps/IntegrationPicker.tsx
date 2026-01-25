"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Network, Key, Database, HardDrive, Settings2, Server } from "lucide-react";
import Link from "next/link";
import type { IntegrationListItem, CoreIntegrationType } from "@/lib/types";

interface IntegrationPickerProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  filterType?: CoreIntegrationType;  // 특정 타입만 표시
  filterDeployableOnly?: boolean;    // MCP Server에서 AgentCore 배포 가능한 것만 표시 (self-hosted, template)
  singleSelect?: boolean;        // 단일 선택 모드
  buttonLabel?: string;          // 버튼 라벨 커스텀
  buttonIcon?: React.ReactNode;  // 버튼 아이콘 커스텀
}

export function IntegrationPicker({
  selectedIds,
  onSelectionChange,
  filterType,
  filterDeployableOnly = false,
  singleSelect = false,
  buttonLabel,
  buttonIcon,
}: IntegrationPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CoreIntegrationType>(filterType || "gateway");
  const [integrations, setIntegrations] = useState<{
    gateway: IntegrationListItem[];
    identity: IntegrationListItem[];
    rag: IntegrationListItem[];
    s3: IntegrationListItem[];
    'mcp-server': IntegrationListItem[];
  }>({ gateway: [], identity: [], rag: [], s3: [], 'mcp-server': [] });
  const [localSelection, setLocalSelection] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (open) {
      fetchIntegrations();
      setLocalSelection(selectedIds);
    }
  }, [open, selectedIds]);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/integrations");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      const items = data.integrations || [];

      // MCP Server filtering: if filterDeployableOnly, only show self-hosted and template
      // (AgentCore Runtime cannot run stdio MCP servers like external/aws)
      let mcpServers = items.filter((i: IntegrationListItem) => i.type === "mcp-server");
      if (filterDeployableOnly) {
        mcpServers = mcpServers.filter((i: IntegrationListItem) =>
          i.mcpSourceType === 'self-hosted' || i.mcpSourceType === 'template'
        );
      }

      setIntegrations({
        gateway: items.filter((i: IntegrationListItem) => i.type === "gateway"),
        identity: items.filter((i: IntegrationListItem) => i.type === "identity"),
        rag: items.filter((i: IntegrationListItem) => i.type === "rag"),
        s3: items.filter((i: IntegrationListItem) => i.type === "s3"),
        'mcp-server': mcpServers,
      });
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    if (singleSelect) {
      // 단일 선택: 토글 또는 새로 선택
      setLocalSelection((prev) => (prev.includes(id) ? [] : [id]));
    } else {
      setLocalSelection((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );
    }
  };

  const handleConfirm = () => {
    onSelectionChange(localSelection);
    setOpen(false);
  };

  // filterType이 있으면 해당 타입만 카운트
  const totalCount = filterType
    ? integrations[filterType].length
    : integrations.gateway.length + integrations.identity.length + integrations.rag.length + integrations.s3.length + integrations['mcp-server'].length;
  const selectedCount = selectedIds.length;

  // 표시할 타입 목록
  const visibleTypes: CoreIntegrationType[] = filterType
    ? [filterType]
    : ["gateway", "identity", "rag", "s3", "mcp-server"];

  const typeConfig: Record<CoreIntegrationType, { icon: typeof Network; label: string; color: string }> = {
    gateway: { icon: Network, label: "Gateway", color: "bg-blue-100 text-blue-700" },
    identity: { icon: Key, label: "Identity", color: "bg-purple-100 text-purple-700" },
    rag: { icon: Database, label: "RAG", color: "bg-emerald-100 text-emerald-700" },
    s3: { icon: HardDrive, label: "S3", color: "bg-orange-100 text-orange-700" },
    'mcp-server': { icon: Server, label: "MCP Server", color: "bg-violet-100 text-violet-700" },
  };

  // AWS 역할 레이블 매핑
  const awsRoleLabels: Record<string, string> = {
    'solutions-architect': 'Solutions Architect',
    'software-developer': 'Software Developer',
    'devops-engineer': 'DevOps Engineer',
    'data-engineer': 'Data Engineer',
    'security-engineer': 'Security Engineer',
  };

  const renderIntegrationList = (items: IntegrationListItem[], type: CoreIntegrationType) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500">
          <p className="text-sm">등록된 {typeConfig[type].label} 통합이 없습니다</p>
          <Link href="/settings" className="text-xs text-blue-500 hover:underline mt-2 inline-block">
            설정 페이지에서 등록하기
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item) => {
          // AWS MCP 역할 정보
          const isAwsMcp = type === 'mcp-server' && item.mcpSourceType === 'aws';
          const awsRole = item.mcpConfig?.env?.AWS_MCP_ROLE;

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                localSelection.includes(item.id)
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
              }`}
              onClick={() => toggleSelection(item.id)}
            >
              <Checkbox
                checked={localSelection.includes(item.id)}
                onCheckedChange={() => toggleSelection(item.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <Badge variant="outline" className={`${typeConfig[type].color} text-xs`}>
                    {typeConfig[type].label}
                  </Badge>
                  {isAwsMcp && awsRole && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                      {awsRoleLabels[awsRole] || awsRole}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>
                )}
                {isAwsMcp && (
                  <p className="text-xs text-orange-600 mt-1">
                    AWS 솔루션 구축 가이드 제공
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 기본 버튼 라벨과 아이콘
  const defaultLabel = filterType
    ? `+ ${typeConfig[filterType].label} 선택`
    : "등록된 통합에서 선택";
  const defaultIcon = filterType ? null : <Settings2 className="h-4 w-4" />;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          {buttonIcon !== undefined ? buttonIcon : defaultIcon}
          {buttonLabel || defaultLabel}
          {selectedCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selectedCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className={filterType ? "max-w-xl" : "max-w-3xl"}>
        <DialogHeader>
          <DialogTitle>
            {filterType ? `${typeConfig[filterType].label} 선택` : "통합 선택"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 mb-2">등록된 통합이 없습니다</p>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                설정 페이지로 이동
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className={`flex gap-4 ${filterType ? "min-h-[300px]" : "min-h-[400px]"}`}>
              {/* Sidebar - filterType이 없을 때만 표시 */}
              {!filterType && (
                <div className="w-40 flex-shrink-0 border-r pr-4">
                  <nav className="space-y-1">
                    {visibleTypes.map((type) => {
                      const config = typeConfig[type];
                      const Icon = config.icon;
                      const count = integrations[type].length;
                      const isActive = activeTab === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setActiveTab(type)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary border-l-2 border-primary font-medium"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="flex-1 text-left">{config.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            {count}
                          </Badge>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {renderIntegrationList(integrations[filterType || activeTab], filterType || activeTab)}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-slate-500">
                {localSelection.length}개 선택됨
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleConfirm}>확인</Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
