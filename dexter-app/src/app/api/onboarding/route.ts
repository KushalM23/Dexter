import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiUser } from "@/lib/api-session";
import { completeOnboarding } from "@/lib/domain";

const schema = z.object({
  displayName: z.string().min(2).max(24),
  avatarId: z.string().min(3),
});

export async function POST(request: Request) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  await completeOnboarding(user.id, body);
  return NextResponse.json({ ok: true });
}
