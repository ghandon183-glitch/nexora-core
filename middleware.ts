import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PREMIUM_BLOG_ARTICLES = new Set([
  "designing-for-the-second-glance",
  "the-architecture-of-attention",
  "the-economics-of-independent-publishing",
  "the-last-paragraph",
  "the-quiet-return-of-slow-software",
  "what-we-learned-from-a-year-of-edge-computing",
]);

const PREMIUM_BLOG_CATEGORIES = new Set([
  "business",
  "culture",
  "design",
  "science",
  "technology",
]);

function getLegacyDemoRedirect(pathname: string): string | null {
  const articleMatch = pathname.match(
    /^\/(?:en\/)?articles\/([^/]+)\/?$/
  );
  if (articleMatch && PREMIUM_BLOG_ARTICLES.has(articleMatch[1])) {
    return `/demo/premium-blog/articles/${articleMatch[1]}/`;
  }

  const categoryMatch = pathname.match(
    /^\/(?:en\/)?category\/([^/]+)\/?$/
  );
  if (categoryMatch && PREMIUM_BLOG_CATEGORIES.has(categoryMatch[1])) {
    return `/demo/premium-blog/category/${categoryMatch[1]}/`;
  }

  if (pathname === "/menu" || pathname === "/en/menu") {
    return "/demo/premium-restaurant/menu/";
  }

  if (pathname === "/reserve" || pathname === "/en/reserve") {
    return "/demo/premium-restaurant/reserve/";
  }

  if (pathname === "/en/docs/all-templates") {
    return "/en/docs";
  }

  if (pathname === "/en/templates/all-templates") {
    return "/en/templates";
  }

  if (
    pathname === "/demo/aether" ||
    pathname === "/demo/aether/" ||
    pathname === "/demo/aether/index.html"
  ) {
    return "https://nexora-aether-demo.nxora.workers.dev/";
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const legacyRedirect = getLegacyDemoRedirect(pathname);
  if (legacyRedirect) {
    return NextResponse.redirect(new URL(legacyRedirect, request.url), 301);
  }

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
  matcher: ["/demo/aether/index.html", "/((?!api|_next|_vercel|.*\\..*).*)", "/downloads/:path*"],
};
