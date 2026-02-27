"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Link from "@cloudscape-design/components/link";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <Container
          header={<Header variant="h1">인증 오류</Header>}
        >
          <SpaceBetween size="l">
            <Alert type="error">
              {error === "AccessDenied"
                ? "접근이 거부되었습니다. 이메일 인증을 완료해주세요."
                : "인증 중 오류가 발생했습니다. 다시 시도해주세요."}
            </Alert>
            <SpaceBetween size="s" direction="horizontal">
              <Button variant="primary" href="/auth/signin">
                다시 로그인
              </Button>
              <Link href="/">소개 페이지로 이동</Link>
            </SpaceBetween>
          </SpaceBetween>
        </Container>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}
