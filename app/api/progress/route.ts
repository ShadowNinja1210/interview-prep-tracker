import { NextResponse } from "next/server";
import { Database } from "@/lib/database";

export async function GET() {
  try {
    console.log("API: Getting progress metrics...");

    const metrics = await Database.getProgressMetrics();

    console.log("API: Progress metrics:", {
      total_pointers: metrics.total_pointers,
      completed_pointers: metrics.completed_pointers,
      completion_rate: metrics.completion_rate,
      weighted_score: metrics.weighted_score,
      topic_count: Object.keys(metrics.topic_breakdown).length,
    });

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error("API: Failed to get progress metrics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get progress metrics",
      },
      { status: 500 }
    );
  }
}
