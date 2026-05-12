import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiUser } from "@/lib/api-session";
import { processCapture } from "@/lib/domain";

const schema = z.object({
  imageData: z.string().min(20),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getApiUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = schema.parse(await request.json());
    const result = await processCapture(user.id, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/capture] Unhandled error:", error);
    return NextResponse.json(
      {
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Try again.",
      },
      { status: 500 },
    );
  }
}
