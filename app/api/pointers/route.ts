import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { pointer, history } = await request.json();

    console.log("API: Creating pointer:", pointer.title);

    // Create the pointer
    const newPointer = await Database.createPointer({
      title: pointer.title,
      topic: pointer.topic,
      status: "not_started",
      weightage: 5, // Default weightage
      feedback_summary: "Created from feedback analysis",
      action_steps: pointer.action_steps,
      user_id: user.id,
    });

    console.log("API: Created pointer:", newPointer.id);

    // Add to history if provided
    if (history) {
      await Database.addPointerHistory({
        pointer_id: newPointer.id,
        change_type: "created",
        ai_reasoning: history.ai_reasoning,
        similarity_score: history.similarity_score,
        remarks: "AI-suggested pointer approved by user",
        previous_status: null,
        new_status: "not_started",
        user_id: user.id,
      });
    }

    // Get updated pointers list
    const updatedPointers = await Database.getPointers(user.id);

    return NextResponse.json({
      success: true,
      pointer: newPointer,
      pointersCount: updatedPointers.length,
      message: `Pointer "${pointer.title}" created successfully`,
    });
  } catch (error) {
    console.error("API: Failed to create pointer:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create pointer",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pointers = await Database.getPointers(user.id);
    return NextResponse.json({
      success: true,
      pointers,
      count: pointers.length,
    });
  } catch (error) {
    console.error("API: Failed to get pointers:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get pointers",
      },
      { status: 500 }
    );
  }
}
