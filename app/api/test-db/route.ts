import { NextResponse } from "next/server";
import { Database } from "@/lib/database";

export async function GET() {
  try {
    // Test database connection by getting pointers
    const pointers = await Database.getPointers();

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      pointersCount: pointers.length,
      pointers: pointers.slice(0, 3), // Show first 3 pointers as sample
    });
  } catch (error) {
    console.error("Database test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Database connection failed",
      },
      { status: 500 }
    );
  }
}
