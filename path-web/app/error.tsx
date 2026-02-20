"use client";

import { useEffect } from "react";
import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppLayoutShell>
      <ContentLayout
        header={
          <Header variant="h1">오류가 발생했습니다</Header>
        }
      >
        <Container>
          <SpaceBetween size="l">
            <Alert type="error">
              페이지를 표시하는 중 문제가 발생했습니다. 다시 시도하거나 처음부터 시작해 주세요.
            </Alert>
            <Box>
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={reset} iconName="refresh">
                  다시 시도
                </Button>
                <Button variant="link" href="/" iconName="arrow-left">
                  처음으로
                </Button>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>
      </ContentLayout>
    </AppLayoutShell>
  );
}
