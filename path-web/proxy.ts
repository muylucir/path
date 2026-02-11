import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3009",
  "https://d21k0iabhuk0yx.cloudfront.net",
  "https://path.workloom.net",
];

const ALLOWED_ORIGINS: string[] = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS;

export function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Origin 기반 검증 (브라우저 요청만 허용)
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (referer) {
    if (!ALLOWED_ORIGINS.some((o) => referer.startsWith(o))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 상태 변경 요청(POST/PUT/DELETE)은 Origin 또는 Referer 필수 (CSRF 방어)
  // GET은 허용 — same-origin GET은 브라우저가 Origin을 보내지 않는 것이 표준 동작
  const method = request.method.toUpperCase();
  if (!origin && !referer && ["POST", "PUT", "DELETE"].includes(method)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
