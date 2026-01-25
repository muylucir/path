"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Rocket,
  Trash2,
  Play,
  Package,
  Upload,
  Server,
  FileText,
  History,
  RotateCcw,
  Code,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { LogViewer } from "@/components/deployments/LogViewer";
import { PlaygroundChat } from "@/components/deployments/PlaygroundChat";
import { SdkExamples } from "@/components/deployments/SdkExamples";
import type { Deployment, DeploymentStatus, DeploymentVersion } from "@/lib/types";

export default function DeploymentsPage() {
  const router = useRouter();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deploymentToDelete, setDeploymentToDelete] = useState<string | null>(null);
  // Log viewer drawer
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [selectedDeploymentForLogs, setSelectedDeploymentForLogs] = useState<Deployment | null>(null);
  // Version history drawer
  const [versionDrawerOpen, setVersionDrawerOpen] = useState(false);
  const [selectedDeploymentForVersions, setSelectedDeploymentForVersions] = useState<Deployment | null>(null);
  const [versions, setVersions] = useState<DeploymentVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  // Playground drawer
  const [playgroundDrawerOpen, setPlaygroundDrawerOpen] = useState(false);
  const [selectedDeploymentForPlayground, setSelectedDeploymentForPlayground] = useState<Deployment | null>(null);
  // SDK examples drawer
  const [sdkDrawerOpen, setSdkDrawerOpen] = useState(false);
  const [selectedDeploymentForSdk, setSelectedDeploymentForSdk] = useState<Deployment | null>(null);

  useEffect(() => {
    loadDeployments();

    // 5초마다 자동 새로고침 (진행 중인 배포 업데이트)
    const interval = setInterval(() => {
      loadDeployments();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadDeployments = async () => {
    try {
      const response = await fetch("/api/bedrock/deployments?limit=20");
      const data = await response.json();

      setDeployments(data.deployments || []);
    } catch (error) {
      console.error("Error loading deployments:", error);
      toast.error("배포 목록 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (deploymentId: string) => {
    setDeploymentToDelete(deploymentId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deploymentToDelete) return;

    try {
      const response = await fetch(`/api/bedrock/deployments/${deploymentToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("삭제 실패");
      }

      const data = await response.json();

      // 목록에서 제거
      setDeployments((prev) =>
        prev.filter((d) => d.deployment_id !== deploymentToDelete)
      );

      // 경고 메시지가 있으면 함께 표시
      if (data.warning) {
        toast.warning(data.warning, { duration: 8000 });
      } else {
        toast.success("배포가 삭제되었습니다");
      }
    } catch (error) {
      console.error("Error deleting deployment:", error);
      toast.error("배포 삭제 실패");
    } finally {
      setDeleteDialogOpen(false);
      setDeploymentToDelete(null);
    }
  };

  const openPlayground = (deployment: Deployment) => {
    setSelectedDeploymentForPlayground(deployment);
    setPlaygroundDrawerOpen(true);
  };

  const openSdkDrawer = (deployment: Deployment) => {
    setSelectedDeploymentForSdk(deployment);
    setSdkDrawerOpen(true);
  };

  const openLogDrawer = (deployment: Deployment) => {
    setSelectedDeploymentForLogs(deployment);
    setLogDrawerOpen(true);
  };

  const openVersionDrawer = async (deployment: Deployment) => {
    setSelectedDeploymentForVersions(deployment);
    setVersionDrawerOpen(true);
    setIsLoadingVersions(true);

    try {
      const response = await fetch(
        `/api/bedrock/deployments/${deployment.deployment_id}/versions`
      );
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error("Error loading versions:", error);
      toast.error("버전 목록 로드 실패");
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRollback = async (targetVersion: number) => {
    if (!selectedDeploymentForVersions) return;

    setIsRollingBack(true);
    try {
      const response = await fetch(
        `/api/bedrock/deployments/${selectedDeploymentForVersions.deployment_id}/rollback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target_version: targetVersion }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "롤백 실패");
      }

      const data = await response.json();
      toast.success(`v${targetVersion}에서 롤백 완료`);
      setVersionDrawerOpen(false);
      loadDeployments();
    } catch (error: any) {
      console.error("Error rolling back:", error);
      toast.error(error.message || "롤백 실패");
    } finally {
      setIsRollingBack(false);
    }
  };

  const getStatusBadge = (status: DeploymentStatus, progress: number) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            활성
          </Badge>
        );
      case "building":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Package className="h-3 w-3 animate-pulse" />
            빌드중 ({progress}%)
          </Badge>
        );
      case "pushing":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Upload className="h-3 w-3 animate-pulse" />
            푸시중 ({progress}%)
          </Badge>
        );
      case "deploying":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Server className="h-3 w-3 animate-pulse" />
            배포중 ({progress}%)
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            대기중
          </Badge>
        );
      case "stopped":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            중지됨
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="error" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            실패
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: number | string) => {
    const date =
      typeof timestamp === "number"
        ? new Date(timestamp * 1000)
        : new Date(timestamp);

    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  };

  const formatDuration = (
    start: number | string,
    end?: number | string | null
  ) => {
    if (!end) return "-";

    const startTime =
      typeof start === "number" ? start * 1000 : new Date(start).getTime();
    const endTime =
      typeof end === "number" ? end * 1000 : new Date(end).getTime();

    const duration = endTime - startTime;
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}분 ${seconds % 60}초`;
  };

  const isInProgress = (status: DeploymentStatus) => {
    return ["pending", "building", "pushing", "deploying"].includes(status);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              배포 관리
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadDeployments}>
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : deployments.length === 0 ? (
            <div className="text-center p-12">
              <p className="text-muted-foreground">배포 히스토리가 없습니다.</p>
              <Button onClick={() => router.push("/code-jobs")} className="mt-4">
                코드 생성 작업으로 이동
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {deployments.map((deployment) => (
                  <div
                    key={deployment.deployment_id}
                    className="border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium font-mono truncate">
                          {deployment.agent_name}
                        </p>
                        {deployment.pain_point && (
                          <p className="text-xs text-muted-foreground truncate">
                            {deployment.pain_point}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          v{deployment.version} | {deployment.region}
                        </p>
                      </div>
                      {getStatusBadge(deployment.status, deployment.progress)}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {deployment.message}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(deployment.created_at)}
                      </span>
                      <div className="flex gap-1">
                        {deployment.status === "active" && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openPlayground(deployment)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              테스트
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSdkDrawer(deployment)}
                              title="SDK 예제"
                            >
                              <Code className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLogDrawer(deployment)}
                          title="로그 보기"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openVersionDrawer(deployment)}
                          title="버전 히스토리"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(deployment.deployment_id)}
                          disabled={isInProgress(deployment.status)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {deployment.status === "failed" && deployment.error && (
                      <div className="text-sm text-destructive pt-2 border-t">
                        {deployment.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent 이름</TableHead>
                      <TableHead>Pain Point</TableHead>
                      <TableHead>버전</TableHead>
                      <TableHead>리전</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>진행 상황</TableHead>
                      <TableHead>생성 시간</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deployments.map((deployment) => (
                      <TableRow key={deployment.deployment_id}>
                        <TableCell className="font-mono text-sm">
                          {deployment.agent_name}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate">
                            {deployment.pain_point || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">
                          v{deployment.version}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {deployment.region}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(deployment.status, deployment.progress)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="space-y-1">
                            <p className="text-sm truncate">{deployment.message}</p>
                            {deployment.status === "failed" && deployment.error && (
                              <p className="text-xs text-destructive">
                                {deployment.error}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(deployment.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {deployment.status === "active" && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openPlayground(deployment)}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  테스트
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openSdkDrawer(deployment)}
                                  title="SDK 예제"
                                >
                                  <Code className="h-4 w-4 mr-1" />
                                  SDK
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openLogDrawer(deployment)}
                              title="로그 보기"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openVersionDrawer(deployment)}
                              title="버전 히스토리"
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                openDeleteDialog(deployment.deployment_id)
                              }
                              disabled={isInProgress(deployment.status)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>배포 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 배포를 삭제하시겠습니까? 활성 상태인 경우 Runtime도 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Log Viewer Drawer */}
      <Drawer direction="right" open={logDrawerOpen} onOpenChange={setLogDrawerOpen}>
        <DrawerContent className="h-full w-full sm:max-w-4xl">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              배포 로그
            </DrawerTitle>
            <DrawerDescription>
              {selectedDeploymentForLogs?.agent_name} (v{selectedDeploymentForLogs?.version})
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-auto p-4">
            {selectedDeploymentForLogs && (
              <LogViewer
                deploymentId={selectedDeploymentForLogs.deployment_id}
                maxHeight="calc(100vh - 150px)"
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Version History Drawer */}
      <Drawer direction="right" open={versionDrawerOpen} onOpenChange={setVersionDrawerOpen}>
        <DrawerContent className="h-full w-full sm:max-w-4xl">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              버전 히스토리
            </DrawerTitle>
            <DrawerDescription>
              {selectedDeploymentForVersions?.agent_name}의 배포 버전 목록
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-auto p-4">
            {isLoadingVersions ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : versions.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                버전 히스토리가 없습니다
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.deployment_id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      version.is_current ? "bg-primary/5 border-primary/30" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">v{version.version}</span>
                        {version.is_current && (
                          <Badge variant="default" className="text-xs">
                            현재
                          </Badge>
                        )}
                        <Badge
                          variant={
                            version.status === "active"
                              ? "success"
                              : version.status === "failed"
                              ? "error"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {version.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(version.created_at)}
                      </p>
                      {version.ecr_image_uri && (
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                          {version.ecr_image_uri}
                        </p>
                      )}
                    </div>
                    {!version.is_current &&
                      version.status === "active" &&
                      version.ecr_image_uri && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRollback(version.version)}
                          disabled={isRollingBack}
                        >
                          {isRollingBack ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-1" />
                              롤백
                            </>
                          )}
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Playground Drawer */}
      <Drawer direction="right" open={playgroundDrawerOpen} onOpenChange={setPlaygroundDrawerOpen}>
        <DrawerContent className="h-full w-full sm:max-w-4xl">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Playground
            </DrawerTitle>
            <DrawerDescription>
              {selectedDeploymentForPlayground?.agent_name}
              {selectedDeploymentForPlayground?.pain_point && (
                <span className="block text-xs mt-0.5">{selectedDeploymentForPlayground.pain_point}</span>
              )}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            {selectedDeploymentForPlayground && (
              <PlaygroundChat deployment={selectedDeploymentForPlayground} />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* SDK Examples Drawer */}
      <Drawer direction="right" open={sdkDrawerOpen} onOpenChange={setSdkDrawerOpen}>
        <DrawerContent className="h-full w-full sm:max-w-4xl">
          <DrawerHeader className="border-b">
            <DrawerTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              SDK 예제 코드
            </DrawerTitle>
            <DrawerDescription>
              {selectedDeploymentForSdk?.agent_name}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-auto p-4">
            {selectedDeploymentForSdk && (
              <SdkExamples deployment={selectedDeploymentForSdk} />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
