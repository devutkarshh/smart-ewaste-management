import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith("/admin") || pathname.startsWith("/vendor") || pathname.startsWith("/report") || pathname.startsWith("/item")) {
    const cookie = req.cookies.get("session")?.value
    if (!cookie) {
      let loginPath = "/login"
      if (pathname.startsWith("/vendor")) loginPath = "/login/vendor"
      else if (pathname.startsWith("/admin") || pathname.startsWith("/item")) loginPath = "/login/admin"
      else if (pathname.startsWith("/report")) loginPath = "/login/student"
      const url = req.nextUrl.clone()
      url.pathname = loginPath
      url.searchParams.set("from", pathname)
      return NextResponse.redirect(url)
    }
    try {
      // Accept legacy JSON cookie or minimal {role} shape
      const session = JSON.parse(cookie) as { user?: { role?: string } }
      if (pathname.startsWith("/admin") && session.user?.role === "admin") {
        return NextResponse.next()
      }
      if (pathname.startsWith("/vendor") && (session.user?.role === "vendor" || session.user?.role === "admin")) {
        return NextResponse.next()
      }
      if (pathname.startsWith("/report") && (session.user?.role === "admin" || session.user?.role === "student" || session.user?.role === "coordinator")) {
        return NextResponse.next()
      }
      if (pathname.startsWith("/item") && session.user?.role === "admin") {
        return NextResponse.next()
      }

      // Not authorized
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    } catch {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/report", "/item/:path*"],
}