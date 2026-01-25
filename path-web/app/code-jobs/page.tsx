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
import { Loader2, Download, Eye, CheckCircle, AlertCircle, Clock, Code2, Trash2, Rocket } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CodeGenerationJob {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  created_at: number;  // Unix timestamp (초 단위)
  completed_at?: number | null;  // Unix timestamp (초 단위)
  error?: string | null;
  file_count?: number | null;
  // 메타데이터
  pain_point?: string | null;
  pattern?: string | null;
  feasibility_score?: number | null;
}

export default function CodeJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<CodeGenerationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  // Deploy dialog state
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [jobToDeploy, setJobToDeploy] = useState<CodeGenerationJob | null>(null);
  const [agentName, setAgentName] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    loadJobs();

    // 5초마다 자동 새로고침 (진행 중인 작업 업데이트)
    const interval = setInterval(() => {
      loadJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const response = await fetch("/api/bedrock/code-jobs?limit=20");
      const data = await response.json();

      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("작업 목록 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/bedrock/code-jobs/${jobId}/download`);

      if (!response.ok) {
        throw new Error("다운로드 실패");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `strands-agent-code-${jobId.slice(0, 8)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("다운로드 완료");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("다운로드 실패");
    }
  };

  const openDeleteDialog = (jobId: string) => {
    setJobToDelete(jobId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!jobToDelete) return;

    try {
      const response = await fetch(`/api/bedrock/code-jobs/${jobToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("삭제 실패");
      }

      // 목록에서 제거
      setJobs((prev) => prev.filter((job) => job.job_id !== jobToDelete));
      toast.success("작업이 삭제되었습니다");
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("작업 삭제 실패");
    } finally {
      setDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  const openDeployDialog = (job: CodeGenerationJob) => {
    setJobToDeploy(job);
    // Generate a default agent name from pain_point or pattern
    const defaultName = (job.pain_point || job.pattern || "agent")
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
    setAgentName(defaultName || "my-agent");
    setDeployDialogOpen(true);
  };

  const handleDeploy = async () => {
    if (!jobToDeploy || !agentName) return;

    setIsDeploying(true);
    try {
      const response = await fetch("/api/bedrock/deployments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: jobToDeploy.job_id,
          agent_name: agentName,
          region: "us-west-2",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "배포 생성 실패");
      }

      toast.success("배포가 시작되었습니다");
      setDeployDialogOpen(false);
      setJobToDeploy(null);
      setAgentName("");

      // 배포 목록 페이지로 이동
      router.push("/deployments");
    } catch (error: any) {
      console.error("Error creating deployment:", error);
      toast.error(error.message || "배포 생성 실패");
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusBadge = (status: string, progress: number) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            완료
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            진행중 ({progress}%)
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            대기중
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
    // Unix timestamp (초 단위)를 밀리초로 변환
    const date = typeof timestamp === "number"
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

  const formatDuration = (start: number | string, end?: number | string | null) => {
    if (!end) return "-";

    // Unix timestamp (초 단위)를 밀리초로 변환
    const startTime = typeof start === "number" ? start * 1000 : new Date(start).getTime();
    const endTime = typeof end === "number" ? end * 1000 : new Date(end).getTime();

    const duration = endTime - startTime;
    const seconds = Math.floor(duration / 1000);
    if (seconds < 60) return `${seconds}초`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}분 ${seconds % 60}초`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              코드 생성 작업 목록
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadJobs}>
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center p-12">
              <p className="text-muted-foreground">작업 히스토리가 없습니다.</p>
              <Button onClick={() => router.push("/")} className="mt-4">
                새 분석 시작하기
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.job_id}
                    className="border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        {job.pain_point && (
                          <p className="text-sm font-medium truncate">
                            {job.pain_point}
                          </p>
                        )}
                        {job.pattern && (
                          <p className="text-xs text-muted-foreground">
                            {job.pattern}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(job.created_at)}
                        </p>
                      </div>
                      {getStatusBadge(job.status, job.progress)}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {job.message}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t gap-2">
                      {job.status === "completed" && (
                        <>
                          <span className="text-sm">
                            {job.file_count}개 파일 생성
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openDeployDialog(job)}
                            >
                              <Rocket className="h-4 w-4 mr-1" />
                              배포
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadJob(job.job_id)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              다운로드
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(job.job_id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                      {job.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(job.job_id)}
                          className="ml-auto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {job.status === "failed" && job.error && (
                      <div className="text-sm text-destructive pt-2 border-t">
                        {job.error}
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
                      <TableHead>Pain Point</TableHead>
                      <TableHead>패턴</TableHead>
                      <TableHead>생성 시간</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>진행 상황</TableHead>
                      <TableHead>소요 시간</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.job_id}>
                        <TableCell className="max-w-sm">
                          <p className="text-sm truncate">
                            {job.pain_point || "정보 없음"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {job.pattern || "-"}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(job.created_at)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(job.status, job.progress)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="space-y-1">
                            <p className="text-sm truncate">{job.message}</p>
                            {job.status === "failed" && job.error && (
                              <p className="text-xs text-destructive">{job.error}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDuration(job.created_at, job.completed_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {job.status === "completed" && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openDeployDialog(job)}
                                >
                                  <Rocket className="h-4 w-4 mr-1" />
                                  배포
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadJob(job.job_id)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  다운로드
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(job.job_id)}
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
            <AlertDialogTitle>작업 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 코드 생성 작업을 삭제하시겠습니까? 생성된 파일도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
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

      {/* Deploy Dialog */}
      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AgentCore 배포</DialogTitle>
            <DialogDescription>
              생성된 Agent 코드를 AgentCore Runtime에 배포합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {jobToDeploy && (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {jobToDeploy.pain_point || "Agent"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {jobToDeploy.pattern}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent 이름</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="my-agent"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                ECR 리포지토리와 Runtime 이름으로 사용됩니다. 영문 소문자, 숫자, 하이픈만 사용 가능합니다.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeployDialogOpen(false)}
              disabled={isDeploying}
            >
              취소
            </Button>
            <Button
              onClick={handleDeploy}
              disabled={!agentName || isDeploying}
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  배포 시작 중...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  배포 시작
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
