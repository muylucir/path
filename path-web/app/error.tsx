"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>
            <AlertCircle className="h-5 w-5 text-destructive" />
            오류가 발생했습니다
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            페이지를 표시하는 중 문제가 발생했습니다. 다시 시도하거나 처음부터 시작해 주세요.
          </p>
          <div className="flex gap-3">
            <Button onClick={reset} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <a href="/">
                <Home className="h-4 w-4" />
                처음으로
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
