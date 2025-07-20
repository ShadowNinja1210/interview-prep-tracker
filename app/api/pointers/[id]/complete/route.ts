import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pointerId = params.id;
    console.log("API: Marking pointer complete:", pointerId);

    // Mark pointer as complete
    const updated = await Database.markPointerComplete(pointerId);

    // Add to history
    await Database.addPointerHistory({
      pointer_id: pointerId,
      change_type: "marked_complete",
      ai_reasoning: "User marked as complete via checklist",
      similarity_score: null,
      remarks: "Manually completed",
      previous_status: "not_started", // We don't have the previous status, so default
      new_status: "completed",
    });

    // Get updated pointers list
    const updatedPointers = await Database.getPointers();

    return NextResponse.json({
      success: true,
      pointer: updated,
      pointersCount: updatedPointers.length,
      message: `Pointer "${updated.title}" marked as complete`,
    });
  } catch (error) {
    console.error("API: Failed to mark pointer complete:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to mark pointer complete",
      },
      { status: 500 }
    );
  }
}
