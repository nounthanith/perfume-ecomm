import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  if (nextUrl.pathname === "/login" || nextUrl.pathname === "/register") {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(role === "cashier" ? "/pos" : "/", nextUrl)
      );
    }
    return NextResponse.next();
  }

  if (nextUrl.pathname === "/" && isLoggedIn && role === "cashier") {
    return NextResponse.redirect(new URL("/pos", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/login", "/register", "/"],
};
