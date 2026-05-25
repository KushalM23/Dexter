import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-session";
import { getChallengesData } from "@/lib/domain";

export async function GET() {
  try {
    const user = await getApiUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await getChallengesData(user.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/challenges] Unhandled error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong. Try again.",
      },
      { status: 500 },
    );
  }
}
