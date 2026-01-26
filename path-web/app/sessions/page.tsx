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
import { Loader2, Trash2, Eye, CheckCircle, AlertTriangle, RefreshCw, Database } from "lucide-react";
import { formatKST } from "@/lib/utils";
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
        // 사용자 원본 입력 우선, 없으면 Claude 분석 결과 사용 (하위 호환)
        inputType: session.user_input_type || session.input_type,
        processSteps: session.user_process_steps || session.process_steps,
        outputTypes: session.user_output_types || [session.output_type],
        humanLoop: session.human_loop,
        // 새 구조: 카테고리별 통합 (레거시 호환을 위해 data_source도 유지)
        selectedGateways: [],
        selectedRAGs: [],
        selectedS3s: [],
        data_source: session.data_source,  // 레거시 문자열 형태 (하위 호환)
        additionalSources: "",
        errorTolerance: session.error_tolerance,
        additionalContext: session.additional_context,
        useAgentCore: session.use_agentcore ?? true,  // AgentCore 항상 사용
        // 선택한 통합 정보
        integrationDetails: session.integration_details || [],
      }));
      sessionStorage.setItem("chatHistory", JSON.stringify(session.chat_history || []));
      sessionStorage.setItem("specification", session.specification || "");
      sessionStorage.setItem("analysis", JSON.stringify({
        pain_point: session.pain_point,
        input_type: session.input_type,
        process_steps: session.process_steps,
        output_types: [session.output_type],
        human_loop: session.human_loop,
        pattern: session.pattern,
        pattern_reason: session.pattern_reason,
        feasibility_breakdown: session.feasibility_breakdown,
        feasibility_score: session.feasibility_score,
        recommendation: session.recommendation,
        risks: session.risks,
        next_steps: session.next_steps,
      }));

      // Store feasibility for the new 4-step flow
      if (session.feasibility_evaluation) {
        // 새 세션: 상세 준비도 점검 결과 사용
        sessionStorage.setItem("feasibility", JSON.stringify(session.feasibility_evaluation));
      } else if (session.feasibility_breakdown) {
        // 레거시 세션: 숫자만 있는 데이터를 상세 구조로 변환
        const convertedBreakdown: Record<string, { score: number; reason: string; current_state: string }> = {};
        for (const [key, value] of Object.entries(session.feasibility_breakdown)) {
          const score = typeof value === 'number' ? value : 0;
          convertedBreakdown[key] = {
            score,
            reason: "기존 세션에서 로드됨 (상세 정보 없음)",
            current_state: score >= 8 ? "준비됨" : score >= 6 ? "양호" : score >= 4 ? "보완 필요" : "준비 필요",
          };
        }
        sessionStorage.setItem("feasibility", JSON.stringify({
          feasibility_breakdown: convertedBreakdown,
          feasibility_score: session.feasibility_score,
          judgment: session.feasibility_score >= 40 ? "즉시 진행" :
                    session.feasibility_score >= 30 ? "조건부 진행" :
                    session.feasibility_score >= 20 ? "재평가 필요" : "대안 모색",
          weak_items: [],
          risks: session.risks || [],
          summary: session.recommendation || "",
        }));
      }

      // Store session ID for update capability
      sessionStorage.setItem("currentSessionId", sessionId);

      // Navigate to results page
      router.push("/results");
    } catch (error) {
      console.error("Error loading session:", error);
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
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortBy === "date") {
      return b.timestamp.localeCompare(a.timestamp);
    } else {
      return b.feasibility_score - a.feasibility_score;
    }
  });

  const getScoreBadge = (score: number) => {
    if (score >= 40) return (
      <Badge variant="success" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Go
      </Badge>
    );
    if (score >= 30) return (
      <Badge variant="warning" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        조건부
      </Badge>
    );
    return (
      <Badge variant="error" className="flex items-center gap-1">
        <RefreshCw className="h-3 w-3" />
        개선 필요
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
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
              <Button onClick={() => router.push("/")} className="mt-4">
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
                      {getScoreBadge(session.feasibility_score)}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-semibold">
                        Feasibility: {session.feasibility_score}/50
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
                      <TableHead className="text-center">판정</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSessions.map((session) => (
                      <TableRow key={session.session_id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatKST(session.timestamp)}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm truncate">{session.pain_point}</p>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {session.feasibility_score}/50
                        </TableCell>
                        <TableCell className="text-center">
                          {getScoreBadge(session.feasibility_score)}
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
