import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Block requests targeting dotfiles and directory traversal attempts
  if (
    pathname.startsWith("/.") ||
    pathname.includes("/.") ||
    pathname.includes("..") ||
    /\/\.(env|git|aws|ssh|config|local|DS_Store|bak|old)/i.test(pathname)
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 2. Strict Origin verification on API routes
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      const allowedOrigins = [
        `http://${host}`,
        `https://${host}`,
        process.env.NEXT_PUBLIC_SITE_URL,
      ].filter(Boolean) as string[];

      const isAllowed = allowedOrigins.some(
        (allowed) => origin === allowed || origin.startsWith(allowed)
      );

      // Block mutating cross-origin calls (POST, PUT, PATCH, DELETE) from unauthorized origins
      if (
        !isAllowed &&
        request.method !== "GET" &&
        request.method !== "HEAD" &&
        request.method !== "OPTIONS"
      ) {
        return NextResponse.json(
          { error: "Cross-Origin request blocked by SummAI security policy." },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all requests except static assets and Next.js internal paths
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
