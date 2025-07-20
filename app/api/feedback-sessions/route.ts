import { NextResponse } from "next/server";
import { Database } from "@/lib/database";

export async function GET() {
  try {
    console.log("API: Getting feedback sessions...");

    const sessions = await Database.getFeedbackSessions();

    console.log("API: Feedback sessions count:", sessions.length);

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("API: Failed to get feedback sessions:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get feedback sessions",
      },
      { status: 500 }
    );
  }
}
