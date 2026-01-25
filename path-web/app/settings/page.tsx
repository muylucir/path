"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network, Key, Database, HardDrive, Plus, Server } from "lucide-react";
import { IntegrationList } from "@/components/settings/IntegrationList";
import { GatewayIntegrationForm } from "@/components/settings/GatewayIntegrationForm";
import { IdentityIntegrationForm } from "@/components/settings/IdentityIntegrationForm";
import { RAGIntegrationForm } from "@/components/settings/RAGIntegrationForm";
import { S3IntegrationForm } from "@/components/settings/S3IntegrationForm";
import { MCPRegistryTab } from "@/components/settings/MCPRegistryTab";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import type { IntegrationType } from "@/lib/types";

// Tab types for settings page (excluding mcp-server which is part of mcp-registry)
type SettingsTabType = "gateway" | "identity" | "rag" | "s3" | "mcp-registry";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTabType>("gateway");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAdd = () => {
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleSaved = () => {
    handleClose();
    setRefreshKey((k) => k + 1);
  };

  const tabConfig: Record<SettingsTabType, { icon: typeof Network; label: string; description: string }> = {
    gateway: {
      icon: Network,
      label: "Gateway",
      description: "API, MCP, Lambda Target을 통합 관리합니다",
    },
    identity: {
      icon: Key,
      label: "Identity",
      description: "Credential Provider를 등록합니다",
    },
    rag: {
      icon: Database,
      label: "RAG",
      description: "Knowledge Base 및 벡터 DB를 등록합니다",
    },
    s3: {
      icon: HardDrive,
      label: "S3",
      description: "Amazon S3 버킷을 등록합니다",
    },
    "mcp-registry": {
      icon: Server,
      label: "MCP Registry",
      description: "MCP 서버를 등록하고 관리합니다",
    },
  };

  // Check if active tab is an integration type (not mcp-registry)
  const isIntegrationTab = activeTab !== "mcp-registry";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 돌아가기 버튼 */}
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              통합 설정
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Gateway, Identity, RAG, S3, MCP 서버를 등록하여 PATH Agent에 활용하세요
            </p>
          </div>
          {isIntegrationTab && (
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              통합 추가
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SettingsTabType)}
        >
          <TabsList className="grid w-full grid-cols-5 mb-6">
            {Object.entries(tabConfig).map(([key, config]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2"
              >
                <config.icon className="w-4 h-4" />
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Integration tabs */}
          {Object.entries(tabConfig)
            .filter(([key]) => key !== "mcp-registry")
            .map(([key, config]) => (
              <TabsContent key={key} value={key}>
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {config.description}
                  </p>
                </div>
                <IntegrationList
                  key={`${key}-${refreshKey}`}
                  type={key as IntegrationType}
                  onEdit={handleEdit}
                  onRefresh={() => setRefreshKey((k) => k + 1)}
                />
              </TabsContent>
            ))}

          {/* MCP Registry tab */}
          <TabsContent value="mcp-registry">
            <MCPRegistryTab />
          </TabsContent>
        </Tabs>

        {/* Form Drawer */}
        <Drawer direction="right" open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DrawerContent className="h-full w-full sm:max-w-2xl">
            <DrawerHeader className="border-b">
              <DrawerTitle>
                {editingId ? "통합 수정" : `${tabConfig[activeTab].label} 통합 추가`}
              </DrawerTitle>
              <DrawerDescription>통합 설정을 구성합니다</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-auto p-6">
              {activeTab === "gateway" && (
                <GatewayIntegrationForm
                  integrationId={editingId}
                  onSaved={handleSaved}
                  onCancel={handleClose}
                />
              )}
              {activeTab === "identity" && (
                <IdentityIntegrationForm
                  integrationId={editingId}
                  onSaved={handleSaved}
                  onCancel={handleClose}
                />
              )}
              {activeTab === "rag" && (
                <RAGIntegrationForm
                  integrationId={editingId}
                  onSaved={handleSaved}
                  onCancel={handleClose}
                />
              )}
              {activeTab === "s3" && (
                <S3IntegrationForm
                  integrationId={editingId}
                  onSaved={handleSaved}
                  onCancel={handleClose}
                />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
