import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paid template packages live under `/downloads/*` as static assets.
  // `wrangler.jsonc` routes these paths through the Worker
  // (`assets.run_worker_first`); here we deny ALL direct public access so
  // the ZIPs can only be obtained via the token-authorized endpoint
  // (`/api/download/[token]`), which fetches them internally through the
  // `ASSETS` binding.
  if (pathname.startsWith("/downloads/")) {
    return new NextResponse(null, { status: 404 });
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all paths except API routes and Next.js internals. Static files
  // are excluded by the dotted-path lookahead, EXCEPT `/downloads/*` which
  // we explicitly match so the deny rule above runs (requires
  // `assets.run_worker_first` in `wrangler.jsonc` to route them here).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)", "/downloads/:path*"],
};
