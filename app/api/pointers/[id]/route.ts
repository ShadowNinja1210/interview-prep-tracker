import { type NextRequest, NextResponse } from "next/server"
import { Database } from "@/lib/database"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    const updatedPointer = await Database.updatePointer(params.id, updates)

    // Add to history
    await Database.addPointerHistory({
      pointer_id: params.id,
      change_type: "updated",
      ai_reasoning: "User updated pointer manually",
      similarity_score: null,
      remarks: "Manual update",
      previous_status: null,
      new_status: updatedPointer.status,
    })

    return NextResponse.json(updatedPointer)
  } catch (error) {
    console.error("Failed to update pointer:", error)
    return NextResponse.json({ error: "Failed to update pointer" }, { status: 500 })
  }
}
