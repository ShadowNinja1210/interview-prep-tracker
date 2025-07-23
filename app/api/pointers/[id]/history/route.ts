import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: pointerId } = await params;
    console.log("API: Getting pointer history:", pointerId);

    const history = await Database.getPointerHistory(pointerId);

    console.log("API: Pointer history count:", history.length);

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
    });
  } catch (error) {
    console.error("API: Failed to get pointer history:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get pointer history",
      },
      { status: 500 }
    );
  }
}
