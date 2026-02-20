"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Table, { type TableProps } from "@cloudscape-design/components/table";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Pagination from "@cloudscape-design/components/pagination";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Modal from "@cloudscape-design/components/modal";
import TextFilter from "@cloudscape-design/components/text-filter";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import { useFlash } from "@/components/cloudscape/FlashbarProvider";
import { formatKST } from "@/lib/utils";
import { getJudgmentBadge } from "@/lib/readiness";
import type { SessionListItem } from "@/lib/types";

const getFinalScore = (session: SessionListItem) =>
  session.improved_feasibility?.score ?? session.feasibility_score;

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<SessionListItem>[] = [
  {
    id: "date",
    header: "날짜",
    cell: (item) => formatKST(item.timestamp),
    sortingComparator: (a, b) => a.timestamp.localeCompare(b.timestamp),
    width: 180,
  },
  {
    id: "painPoint",
    header: "Pain Point",
    cell: (item) => {
      const text = item.pain_point || "";
      return text.length > 60 ? `${text.slice(0, 60)}…` : text;
    },
  },
  {
    id: "score",
    header: "Feasibility",
    cell: (item) => `${getFinalScore(item)}/50`,
    sortingComparator: (a, b) => getFinalScore(a) - getFinalScore(b),
    width: 120,
  },
  {
    id: "status",
    header: "판정",
    cell: (item) => {
      const badge = getJudgmentBadge(getFinalScore(item));
      return <StatusIndicator type={badge.type}>{badge.label}</StatusIndicator>;
    },
    width: 150,
  },
  {
    id: "actions",
    header: "",
    cell: () => null, // Rendered dynamically below
    width: 80,
  },
];

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [pageKeys, setPageKeys] = useState<any[]>([undefined]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SessionListItem[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [sortingColumn, setSortingColumn] = useState<TableProps.SortingColumn<SessionListItem>>(
    COLUMN_DEFINITIONS[0]
  );
  const [sortingDescending, setSortingDescending] = useState(true);
  const { addFlash } = useFlash();

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

      if (data.lastEvaluatedKey && !pageKeys[currentPage]) {
        setPageKeys((prev) => [...prev, data.lastEvaluatedKey]);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      addFlash("error", "세션 목록을 불러오는데 실패했습니다");
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
        inputType: session.user_input_type || session.input_type,
        processSteps: session.user_process_steps || session.process_steps,
        outputTypes: session.user_output_types || session.output_types,
        humanLoop: session.human_loop,
        additionalSources: session.additional_sources || session.data_source,
        errorTolerance: session.error_tolerance,
        additionalContext: session.additional_context,
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
        recommended_architecture: session.recommended_architecture,
        multi_agent_pattern: session.multi_agent_pattern,
        architecture_reason: session.architecture_reason,
        feasibility_breakdown: session.feasibility_breakdown,
        feasibility_score: session.feasibility_score,
        recommendation: session.recommendation,
        risks: session.risks,
        next_steps: session.next_steps,
        improved_feasibility: session.improved_feasibility,
      }));

      if (session.improvement_plans) {
        sessionStorage.setItem("improvementPlans", JSON.stringify(session.improvement_plans));
      }
      if (session.feasibility_evaluation) {
        sessionStorage.setItem("feasibility", JSON.stringify(session.feasibility_evaluation));
      }
      if (session.token_usage) {
        sessionStorage.setItem("tokenUsage", JSON.stringify(session.token_usage));
      }

      sessionStorage.setItem("currentSessionId", sessionId);
      router.push("/");
    } catch (error) {
      console.error("Error loading session:", error);
      addFlash("error", "세션을 불러오는데 실패했습니다");
    }
  };

  const handleDelete = async () => {
    const sessionId = selectedItems[0]?.session_id;
    if (!sessionId) return;

    try {
      await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
      setSelectedItems([]);
      addFlash("success", "세션이 삭제되었습니다");
    } catch (error) {
      console.error("Error deleting session:", error);
      addFlash("error", "세션 삭제에 실패했습니다");
    } finally {
      setDeleteModalVisible(false);
    }
  };

  const filteredSessions = useMemo(() => {
    if (!filteringText) return sessions;
    const lower = filteringText.toLowerCase();
    return sessions.filter((s) => (s.pain_point || "").toLowerCase().includes(lower));
  }, [sessions, filteringText]);

  const sortedSessions = useMemo(() => {
    const comparator = (sortingColumn as any).sortingComparator as
      | ((a: SessionListItem, b: SessionListItem) => number)
      | undefined;
    if (!comparator) return filteredSessions;

    const sorted = [...filteredSessions].sort(comparator);
    return sortingDescending ? sorted.reverse() : sorted;
  }, [filteredSessions, sortingColumn, sortingDescending]);

  // Build column definitions with the handleLoad closure for the actions column
  const columns: TableProps.ColumnDefinition<SessionListItem>[] = useMemo(() => {
    return COLUMN_DEFINITIONS.map((col) => {
      if (col.id === "actions") {
        return {
          ...col,
          cell: (item: SessionListItem) => (
            <Button
              variant="icon"
              iconName="file-open"
              ariaLabel="보기"
              onClick={() => handleLoad(item.session_id)}
            />
          ),
        };
      }
      return col;
    });
  }, []);

  return (
    <AppLayoutShell
      breadcrumbs={[{ text: "세션 목록", href: "/sessions" }]}
    >
      <Table
        enableKeyboardNavigation
        selectionType="single"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
        }
        items={sortedSessions}
        loading={isLoading}
        loadingText="세션을 불러오는 중..."
        columnDefinitions={columns}
        sortingColumn={sortingColumn}
        sortingDescending={sortingDescending}
        onSortingChange={({ detail }) => {
          setSortingColumn(detail.sortingColumn);
          setSortingDescending(detail.isDescending ?? false);
        }}
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${filteredSessions.length}/${sessions.length})`}
            description="이전에 저장한 분석 결과를 확인하고 관리합니다"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={selectedItems.length === 0}
                  onClick={() => setDeleteModalVisible(true)}
                >
                  삭제
                </Button>
                <Button
                  variant="primary"
                  iconName="add-plus"
                  onClick={() => {
                    sessionStorage.clear();
                    router.push("/");
                  }}
                >
                  새 분석
                </Button>
              </SpaceBetween>
            }
          >
            세션 목록
          </Header>
        }
        filter={
          <TextFilter
            filteringPlaceholder="Pain Point 검색"
            filteringText={filteringText}
            onChange={({ detail }) => setFilteringText(detail.filteringText)}
          />
        }
        empty={
          filteringText ? (
            <Box textAlign="center" color="inherit">
              <b>검색 결과 없음</b>
              <Box variant="p" color="inherit">
                검색어와 일치하는 세션이 없습니다.
              </Box>
            </Box>
          ) : (
            <Box textAlign="center" color="inherit">
              <b>세션 없음</b>
              <Box variant="p" color="inherit">
                저장된 분석 세션이 없습니다.
              </Box>
            </Box>
          )
        }
        pagination={
          <Pagination
            currentPageIndex={currentPage}
            pagesCount={hasNextPage ? currentPage + 1 : currentPage}
            onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
          />
        }
      />

      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        header="세션 삭제"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="link" onClick={() => setDeleteModalVisible(false)}>
                취소
              </Button>
              <Button variant="primary" onClick={handleDelete}>
                삭제
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        이 세션을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
      </Modal>
    </AppLayoutShell>
  );
}
