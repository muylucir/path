"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import TopNavigation, { type TopNavigationProps } from "@cloudscape-design/components/top-navigation";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation, { type SideNavigationProps } from "@cloudscape-design/components/side-navigation";
import BreadcrumbGroup, { type BreadcrumbGroupProps } from "@cloudscape-design/components/breadcrumb-group";
import { useTokenUsage } from "@/lib/hooks/useTokenUsage";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const NAV_ITEMS: SideNavigationProps.Item[] = [
  { type: "link", text: "소개", href: "/intro" },
  { type: "link", text: "가이드", href: "/guide" },
  { type: "link", text: "에이전트 디자인", href: "/" },
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
  const { usage, resetUsage } = useTokenUsage();
  const [navigationOpen, setNavigationOpen] = useState(true);

  const handleNavigateHome = () => {
    sessionStorage.clear();
    resetUsage();
    if (pathname === "/") {
      window.location.reload();
    } else {
      router.push("/");
    }
  };

  const tokenUtilities: TopNavigationProps.Utility[] = [];

  if (usage.totalTokens > 0) {
    tokenUtilities.push({
      type: "menu-dropdown",
      iconName: "status-info",
      ariaLabel: "Token Usage",
      title: `${formatTokens(usage.totalTokens)} | $${usage.estimatedCostUSD.toFixed(2)}`,
      items: [
        { id: "model", text: `Model: Claude Opus 4.5` },
        { id: "input", text: `Input: ${usage.inputTokens.toLocaleString()}` },
        { id: "output", text: `Output: ${usage.outputTokens.toLocaleString()}` },
        ...(usage.cacheReadInputTokens
          ? [{ id: "cache-read", text: `Cache Read: ${usage.cacheReadInputTokens.toLocaleString()}` }]
          : []),
        ...(usage.cacheWriteInputTokens
          ? [{ id: "cache-write", text: `Cache Write: ${usage.cacheWriteInputTokens.toLocaleString()}` }]
          : []),
        { id: "total", text: `Total: ${usage.totalTokens.toLocaleString()}` },
        { id: "cost", text: `Est. Cost: $${usage.estimatedCostUSD.toFixed(4)}` },
      ],
      onItemClick: () => {},
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
        if (e.detail.href === "/") {
          handleNavigateHome();
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
            href: "#",
            title: "P.A.T.H Agent Designer",
            onFollow: (e) => {
              e.preventDefault();
              handleNavigateHome();
            },
          }}
          utilities={[
            ...tokenUtilities,
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
      />
    </>
  );
}
