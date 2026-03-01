import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(el|de)/:path*",
    "/((?!api|_next|_vercel|admin|icon|apple-icon|opengraph-image|favicon|robots|sitemap|manifest|.*\\..*).*)",
  ],
};
