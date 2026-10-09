import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = (req.nextauth.token as any)?.role;
    const p = req.nextUrl.pathname;

    const getRedirectUrl = (userRole: string | undefined) => {
      switch (userRole) {
        case "ADMIN":
          return "/admin";
        case "SHELTER":
          return "/shelter/dashboard";
        case "PROVIDER":
          return "/restaurant/dashboard";
        case "DELIVERY":
          return "/deliveries";
        default:
          return "/login";
      }
    };

    if (p.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(getRedirectUrl(role), req.url));
    }
    if (p.startsWith("/restaurant") && role !== "PROVIDER") {
      return NextResponse.redirect(new URL(getRedirectUrl(role), req.url));
    }
    if (p.startsWith("/shelter") && role !== "SHELTER") {
      return NextResponse.redirect(new URL(getRedirectUrl(role), req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/restaurant/:path*",
    "/shelter/:path*",
    "/allocations/:path*",
    "/deliveries/:path*",
    "/notifications/:path*",
    "/profile/:path*",
  ],
};
