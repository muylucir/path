"use client";

import { AppLayoutShell } from "@/components/layout/AppLayoutShell";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";

export default function NotFound() {
  return (
    <AppLayoutShell>
      <ContentLayout
        header={
          <Header variant="h1">페이지를 찾을 수 없습니다</Header>
        }
      >
        <Container>
          <SpaceBetween size="l">
            <Box variant="p" color="text-body-secondary">
              요청하신 페이지가 존재하지 않거나 이동되었습니다.
            </Box>
            <Button variant="primary" href="/" iconName="arrow-left">
              처음으로
            </Button>
          </SpaceBetween>
        </Container>
      </ContentLayout>
    </AppLayoutShell>
  );
}
