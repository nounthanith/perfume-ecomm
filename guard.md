# Guard Usage Guide

The guard utility (`src/lib/guard.ts`) protects routes by checking authentication and roles.

## Available Functions

| Function | Purpose |
|----------|---------|
| `requireAuth()` | Returns session if logged in, `null` if not |
| `requireRole("admin")` | Returns session if user has the role, `null` if not |
| `forbidden()` | Returns 403 JSON response |
| `unauthorized()` | Returns 401 JSON response |

---

## Protect an API Route (Admin Only)

```ts
// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireRole, forbidden } from "@/lib/guard";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

export async function POST(req: NextRequest) {
  // Only admin can create
  const session = await requireRole("admin");
  if (!session) return forbidden();

  const { name } = await req.json();
  await connectDB();
  const category = await Category.create({ name });

  return NextResponse.json({ category }, { status: 201 });
}
```

## Protect an API Route (Any Logged-in User)

```ts
import { requireAuth, unauthorized } from "@/lib/guard";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session) return unauthorized();

  // session.user.id, session.user.email, session.user.role
}
```

## Protect Multiple Roles

```ts
const session = await requireRole("admin", "editor");
if (!session) return forbidden();
```

## Use in Server Actions

```ts
"use server";

import { requireRole } from "@/lib/guard";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

export async function createCategory(name: string) {
  const session = await requireRole("admin");
  if (!session) throw new Error("Forbidden");

  await connectDB();
  return Category.create({ name });
}
```

## Response Examples

| Scenario | Status | Body |
|----------|--------|------|
| Not logged in | 401 | `{ "error": "Unauthorized: please sign in" }` |
| Wrong role | 403 | `{ "error": "Forbidden: insufficient permissions" }` |
| Success | 200/201 | `{ "category": { ... } }` |

---

## Available Roles

Defined in `src/models/User.ts`:

- `user` — regular user (default)
- `admin` — full access

To change a user's role, update it directly in MongoDB:

```js
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
);
```
