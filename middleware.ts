import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = ["/", "/auth/signin", "/auth/signup"]
  const isPublicPath = publicPaths.some((pp) => path === pp || path.startsWith(pp + "/"))
  const isApiAuthRoute = path.startsWith("/api/auth/")
  const isPublicAsset =
    path.startsWith("/images/") ||
    path.startsWith("/_next/static/") ||
    path.startsWith("/_next/image/") ||
    path === "/favicon.ico" ||
    path.endsWith(".svg") ||
    path.endsWith(".png")

  if (isPublicPath || isApiAuthRoute || isPublicAsset) {
    return NextResponse.next()
  }

  // Check for your own session cookie
  const session = request.cookies.get("auth_session")
  if (!session) {
    const signInUrl = new URL("/auth/signin", request.url)
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.svg$|.*\\.png$).*)"],
}
