import { type NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { AIService } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    const { feedback, devilsAdvocateMode } = await request.json();

    if (!feedback || typeof feedback !== "string") {
      return NextResponse.json({ error: "Feedback is required" }, { status: 400 });
    }

    // Get existing pointers for comparison
    const existingPointers = await Database.getPointers();

    // Analyze feedback with AI
    const analysis = await AIService.analyzeFeedback(feedback, existingPointers, devilsAdvocateMode || false);

    // Generate suggested questions
    const topics = [...new Set(existingPointers.map((p) => p.topic))];
    const questions = await AIService.generateSDE2Questions(topics);

    // Create feedback session
    const session = await Database.createFeedbackSession({
      raw_feedback: feedback,
      parsed_pointers: analysis.suggestions,
      ai_comments: analysis.performance_analysis,
      devils_advocate_enabled: devilsAdvocateMode || false,
      performance_score: null, // TODO: Calculate performance score
      suggested_questions: questions,
    });

    return NextResponse.json({
      session,
      analysis,
      questions,
    });
  } catch (error) {
    console.error("Feedback analysis error:", error);

    // Check if it's an API key issue
    if (!process.env.PERPLEXITY_API_KEY) {
      return NextResponse.json(
        {
          error: "Perplexity API key not configured. Please add PERPLEXITY_API_KEY to your .env.local file.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze feedback",
      },
      { status: 500 }
    );
  }
}
