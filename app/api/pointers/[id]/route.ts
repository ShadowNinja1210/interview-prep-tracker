import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, topic, status, weightage, feedback_summary, action_steps } = await request.json();

    // Get the current pointer to save previous state for history
    const currentPointer = await Database.getPointerById(id, user.id);
    if (!currentPointer) {
      return NextResponse.json({ success: false, error: "Pointer not found" }, { status: 404 });
    }

    // Update the pointer
    const updatedPointer = await Database.updatePointer(id, {
      title,
      topic,
      status,
      weightage,
      feedback_summary,
      action_steps,
    });

    // Add to history
    await Database.addPointerHistory({
      pointer_id: id,
      change_type: "updated",
      ai_reasoning: "User updated pointer",
      similarity_score: 1.0,
      remarks: `Updated: ${title}`,
      previous_status: currentPointer.status,
      new_status: status,
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      pointer: updatedPointer,
      message: "Pointer updated successfully",
    });
  } catch (error) {
    console.error("API: Failed to update pointer:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update pointer",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if pointer exists and belongs to user
    const pointer = await Database.getPointerById(id, user.id);
    if (!pointer) {
      return NextResponse.json({ success: false, error: "Pointer not found" }, { status: 404 });
    }

    // Delete the pointer
    await Database.deletePointer(id, user.id);

    return NextResponse.json({
      success: true,
      message: "Pointer deleted successfully",
    });
  } catch (error) {
    console.error("API: Failed to delete pointer:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete pointer",
      },
      { status: 500 }
    );
  }
}
