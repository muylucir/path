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
import { Loader2, Trash2, Eye } from "lucide-react";
import { formatKST } from "@/lib/utils";
import type { SessionListItem } from "@/lib/types";

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"date" | "score">("date");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      setSessions(data.sessions || []);
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

      sessionStorage.setItem("formData", JSON.stringify({
        painPoint: session.pain_point,
        inputType: session.input_type,
        processSteps: session.process_steps,
        outputType: session.output_type,
        humanLoop: session.human_loop,
        dataSource: session.data_source,
        errorTolerance: session.error_tolerance,
        additionalContext: session.additional_context,
      }));
      sessionStorage.setItem("chatHistory", JSON.stringify(session.chat_history));
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

      router.push("/results");
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm("이 세션을 삭제하시겠습니까?")) return;

    try {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch (error) {
      console.error("Error deleting session:", error);
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
    if (score >= 40) return <Badge className="bg-green-600">✅ Go</Badge>;
    if (score >= 30) return <Badge className="bg-yellow-600">⚠️ 조건부</Badge>;
    return <Badge className="bg-red-600">🔄 개선 필요</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>💾 세션 목록</CardTitle>
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
                          onClick={() => handleDelete(session.session_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
