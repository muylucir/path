"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import TopNavigation, { type TopNavigationProps } from "@cloudscape-design/components/top-navigation";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation, { type SideNavigationProps } from "@cloudscape-design/components/side-navigation";
import BreadcrumbGroup, { type BreadcrumbGroupProps } from "@cloudscape-design/components/breadcrumb-group";
import SplitPanel from "@cloudscape-design/components/split-panel";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Box from "@cloudscape-design/components/box";
import KeyValuePairs from "@cloudscape-design/components/key-value-pairs";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useTokenUsage } from "@/lib/hooks/useTokenUsage";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const NAV_ITEMS: SideNavigationProps.Item[] = [
  { type: "link", text: "소개", href: "/" },
  { type: "link", text: "가이드", href: "/guide" },
  { type: "link", text: "에이전트 디자인", href: "/design" },
  { type: "link", text: "세션 목록", href: "/sessions" },
];

interface AppLayoutShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbGroupProps.Item[];
  notifications?: React.ReactNode;
  navigation?: React.ReactNode;
  contentType?: "default" | "wizard" | "table" | "form";
}

export function AppLayoutShell({ children, breadcrumbs, notifications, navigation, contentType }: AppLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { usage, resetUsage } = useTokenUsage();
  const [navigationOpen, setNavigationOpen] = useState(true);
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
  const [splitPanelSize, setSplitPanelSize] = useState(200);

  const handleNavigateDesign = () => {
    sessionStorage.clear();
    resetUsage();
    if (pathname === "/design") {
      window.location.reload();
    } else {
      router.push("/design");
    }
  };

  const tokenUtilities: TopNavigationProps.Utility[] = [];

  if (usage.totalTokens > 0) {
    tokenUtilities.push({
      type: "button",
      iconName: "status-info",
      ariaLabel: "Token Usage",
      title: `${formatTokens(usage.totalTokens)} | $${usage.estimatedCostUSD.toFixed(2)}`,
      onClick: () => setSplitPanelOpen((prev) => !prev),
    });
  }

  const breadcrumbItems: BreadcrumbGroupProps.Item[] = breadcrumbs
    ? [{ text: "P.A.T.H Agent Designer", href: "/" }, ...breadcrumbs]
    : [{ text: "P.A.T.H Agent Designer", href: "/" }];

  const defaultNavigation = (
    <SideNavigation
      header={{ text: "P.A.T.H", href: "/" }}
      activeHref={pathname}
      items={NAV_ITEMS}
      onFollow={(e) => {
        e.preventDefault();
        if (e.detail.href === "/design") {
          handleNavigateDesign();
        } else {
          router.push(e.detail.href);
        }
      }}
    />
  );

  return (
    <>
      <div id="top-nav">
        <TopNavigation
          identity={{
            href: "/",
            title: "P.A.T.H Agent Designer",
            onFollow: (e) => {
              e.preventDefault();
              router.push("/");
            },
          }}
          utilities={[
            ...tokenUtilities,
            ...(session?.user
              ? [
                  {
                    type: "menu-dropdown" as const,
                    text: session.user.name || session.user.email || "User",
                    iconName: "user-profile" as const,
                    items: [
                      {
                        id: "email",
                        text: session.user.email || "",
                        disabled: true,
                      },
                      {
                        id: "signout",
                        text: "로그아웃",
                      },
                    ],
                    onItemClick: ({ detail }: { detail: { id: string } }) => {
                      if (detail.id === "signout") {
                        signOut({ callbackUrl: "/" });
                      }
                    },
                  },
                ]
              : []),
          ]}
        />
      </div>
      <AppLayout
        contentType={contentType}
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
        content={children}
        breadcrumbs={
          <BreadcrumbGroup
            items={breadcrumbItems}
            onFollow={(e) => {
              e.preventDefault();
              router.push(e.detail.href);
            }}
          />
        }
        notifications={notifications}
        navigation={navigation || defaultNavigation}
        toolsHide
        headerSelector="#top-nav"
        stickyNotifications
        splitPanelOpen={splitPanelOpen}
        onSplitPanelToggle={({ detail }) => setSplitPanelOpen(detail.open)}
        splitPanelSize={splitPanelSize}
        onSplitPanelResize={({ detail }) => setSplitPanelSize(detail.size)}
        splitPanelPreferences={{ position: "bottom" }}
        splitPanel={
          usage.totalTokens > 0 ? (
            <SplitPanel
              header="Token Usage"
              headerActions={<Button onClick={resetUsage}>Reset</Button>}
              i18nStrings={{
                closeButtonAriaLabel: "패널 닫기",
                openButtonAriaLabel: "패널 열기",
                preferencesTitle: "패널 설정",
                preferencesPositionLabel: "패널 위치",
                preferencesPositionBottom: "하단",
                preferencesPositionSide: "측면",
                preferencesConfirm: "확인",
                preferencesCancel: "취소",
                resizeHandleAriaLabel: "크기 조절",
              }}
            >
              <SpaceBetween size="l">
                <ColumnLayout columns={4} variant="text-grid">
                  <div>
                    <Box variant="awsui-key-label">Model</Box>
                    <div>Claude Opus 4.6</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Total Tokens</Box>
                    <div>{usage.totalTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <Box variant="awsui-key-label">Estimated Cost</Box>
                    <div>${usage.estimatedCostUSD.toFixed(4)}</div>
                  </div>
                  <div />
                </ColumnLayout>
                <KeyValuePairs
                  columns={4}
                  items={[
                    {
                      label: "Input Tokens",
                      value: usage.inputTokens.toLocaleString(),
                    },
                    {
                      label: "Output Tokens",
                      value: usage.outputTokens.toLocaleString(),
                    },
                    {
                      label: "Cache Read",
                      value: (usage.cacheReadInputTokens || 0).toLocaleString(),
                    },
                    {
                      label: "Cache Write",
                      value: (usage.cacheWriteInputTokens || 0).toLocaleString(),
                    },
                  ]}
                />
              </SpaceBetween>
            </SplitPanel>
          ) : undefined
        }
      />
    </>
  );
}
