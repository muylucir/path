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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { Loader2, Trash2, Eye, Database } from "lucide-react";
import { toast } from "sonner";
import { formatKST } from "@/lib/utils";
import { getJudgmentBadge as getJudgmentBadgeData } from "@/lib/readiness";
import type { SessionListItem } from "@/lib/types";

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageKeys, setPageKeys] = useState<any[]>([undefined]); // 각 페이지의 시작 키
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [currentPage]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const lastKey = pageKeys[currentPage - 1];
      const url = lastKey 
        ? `/api/sessions?lastKey=${encodeURIComponent(JSON.stringify(lastKey))}`
        : "/api/sessions";
      
      const response = await fetch(url);
      const data = await response.json();
      
      setSessions(data.sessions || []);
      setHasNextPage(!!data.lastEvaluatedKey);
      
      // 다음 페이지 키 저장
      if (data.lastEvaluatedKey && !pageKeys[currentPage]) {
        setPageKeys(prev => [...prev, data.lastEvaluatedKey]);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("세션 목록을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      const session = await response.json();

      // Store in sessionStorage
      sessionStorage.setItem("formData", JSON.stringify({
        painPoint: session.pain_point,
        inputType: session.user_input_type,
        processSteps: session.user_process_steps,
        outputTypes: session.user_output_types,
        humanLoop: session.human_loop,
        additionalSources: session.additional_sources || session.data_source,
        errorTolerance: session.error_tolerance,
        additionalContext: session.additional_context,
        integrationDetails: session.integration_details || [],
      }));
      sessionStorage.setItem("chatHistory", JSON.stringify(session.chat_history || []));
      sessionStorage.setItem("specification", session.specification || "");
      sessionStorage.setItem("analysis", JSON.stringify({
        pain_point: session.pain_point,
        input_type: session.input_type,
        process_steps: session.process_steps,
        output_types: session.output_types,
        human_loop: session.human_loop,
        pattern: session.pattern,
        pattern_reason: session.pattern_reason,
        feasibility_breakdown: session.feasibility_breakdown,
        feasibility_score: session.feasibility_score,
        recommendation: session.recommendation,
        risks: session.risks,
        next_steps: session.next_steps,
        improved_feasibility: session.improved_feasibility,
      }));

      // 사용자 개선 방안 복원
      if (session.improvement_plans) {
        sessionStorage.setItem("improvementPlans", JSON.stringify(session.improvement_plans));
      }

      // Store feasibility evaluation
      if (session.feasibility_evaluation) {
        sessionStorage.setItem("feasibility", JSON.stringify(session.feasibility_evaluation));
      }

      // 토큰 사용량 복원
      if (session.token_usage) {
        sessionStorage.setItem("tokenUsage", JSON.stringify(session.token_usage));
      }

      // Store session ID for update capability
      sessionStorage.setItem("currentSessionId", sessionId);

      // Navigate to results page
      router.push("/results");
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("세션을 불러오는데 실패했습니다");
    }
  };

  const openDeleteDialog = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;

    try {
      await fetch(`/api/sessions/${sessionToDelete}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionToDelete));
      toast.success("세션이 삭제되었습니다");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("세션 삭제에 실패했습니다");
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  // 최종 점수 계산 (improved_feasibility가 있으면 그 점수 사용)
  const getFinalScore = (session: SessionListItem) =>
    session.improved_feasibility?.score ?? session.feasibility_score;

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortBy === "date") {
      return b.timestamp.localeCompare(a.timestamp);
    } else {
      return getFinalScore(b) - getFinalScore(a);
    }
  });

  // 점수 기반 판정 배지 (shared utility 사용)
  const renderJudgmentBadge = (session: SessionListItem) => {
    const score = getFinalScore(session);
    const { label, variant } = getJudgmentBadgeData(score);
    const variantClasses: Record<string, string> = {
      green: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
      blue: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
      orange: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
    };
    const iconMap: Record<string, string> = {
      green: "✅", blue: "🔵", yellow: "🟡", orange: "🟠",
    };
    return (
      <Badge className={`${variantClasses[variant] || variantClasses.orange} gap-1`}>
        <span>{iconMap[variant] || "🟠"}</span>
        <span>{label}</span>
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              세션 목록
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "date" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("date")}
              >
                날짜순
              </Button>
              <Button
                variant={sortBy === "score" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("score")}
              >
                점수순
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center p-12">
              <p className="text-muted-foreground">저장된 세션이 없습니다.</p>
              <Button onClick={() => {
                sessionStorage.clear();
                router.push("/");
              }} className="mt-4">
                새 분석 시작하기
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {sortedSessions.map((session) => (
                  <div
                    key={session.session_id}
                    className="border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate pr-2">
                          {session.pain_point}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatKST(session.timestamp)}
                        </p>
                      </div>
                      {renderJudgmentBadge(session)}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-semibold">
                        Feasibility: {getFinalScore(session)}/50
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoad(session.session_id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          보기
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(session.session_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead>Pain Point</TableHead>
                      <TableHead className="text-center">Feasibility</TableHead>
                      <TableHead className="text-center">다음 단계</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSessions.map((session) => (
                      <TableRow key={session.session_id}>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatKST(session.timestamp)}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate">{session.pain_point}</p>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {getFinalScore(session)}/50
                        </TableCell>
                        <TableCell className="text-center">
                          {renderJudgmentBadge(session)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoad(session.session_id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              보기
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(session.session_id)}
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
          
          {/* 페이지네이션 */}
          {!isLoading && sessions.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  <PaginationItem>
                    <PaginationLink isActive>
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>
                  
                  {hasNextPage && (
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  )}
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>세션 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 세션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
