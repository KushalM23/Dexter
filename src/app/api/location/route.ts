import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiUser } from "@/lib/api-session";
import { updateUserEnvironment } from "@/lib/domain";

const schema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(request: Request) {
  const user = await getApiUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  const location = await updateUserEnvironment(user.id, body);
  return NextResponse.json(location);
}
