import { auth } from "./auth";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return session;
}

export async function requireRole(...roles: string[]) {
  const session = await requireAuth();

  if (!session) {
    return null;
  }

  if (!roles.includes(session.user.role)) {
    return null;
  }

  return session;
}

export function forbidden() {
  return NextResponse.json(
    { error: "Forbidden: insufficient permissions" },
    { status: 403 }
  );
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized: please sign in" },
    { status: 401 }
  );
}
