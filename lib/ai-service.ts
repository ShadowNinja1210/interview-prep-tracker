import type { SuggestedQuestion, AIAnalysis, Pointer } from "./types";

export class AIService {
  // Helper function to extract JSON from markdown code blocks
  private static extractJSONFromMarkdown(response: string): string {
    // Remove markdown code block markers
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }

    // If no markdown markers, return as-is (for backwards compatibility)
    return response.trim();
  }
  private static async callPerplexity(prompt: string): Promise<string> {
    try {
      console.log("Making Perplexity API call...");
      console.log("API Key present:", !!process.env.PERPLEXITY_API_KEY);
      console.log("Prompt length:", prompt.length);

      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content:
                "You are an expert SDE-2 interview coach. Provide analytical, data-driven responses without sugar-coating.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 2000,
          temperature: 0.2,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Perplexity API error response:", errorText);
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}. Response: ${errorText}`);
      }

      const data = await response.json();
      console.log("Perplexity response:", data);
      // console.log("Perplexity response structure:", Object.keys(data));
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Perplexity API error:", error);
      // Instead of returning invalid text, throw the error so the caller can handle it properly
      throw error;
    }
  }

  static async analyzeFeedback(
    feedback: string,
    existingPointers: Pointer[],
    devilsAdvocateMode: boolean
  ): Promise<AIAnalysis> {
    const analysisPrompt = `
Analyze this SDE-2 interview preparation feedback and provide:

1. Extract actionable improvement pointers from the feedback
2. Compare with existing pointers for semantic similarity
3. Suggest updates or new pointers
4. ${
      devilsAdvocateMode
        ? "Provide brutally honest, strict analysis without encouragement"
        : "Provide constructive analysis"
    }

Feedback: "${feedback}"

Existing Pointers:
${existingPointers.map((p) => `- ${p.title} (${p.topic}, ${p.status})`).join("\n")}

Respond in JSON format:
{
  "suggestions": [
    {
      "title": "specific actionable pointer",
      "topic": "DSA|LLD|System Design|Behavioral|Coding|Architecture",
      "action_steps": "concrete steps to improve",
      "similarity_score": 0.0-1.0,
      "existing_pointer_id": "uuid or null",
      "ai_reasoning": "why this suggestion was made",
      "is_update": boolean
    }
  ],
  "performance_analysis": "overall performance assessment",
  "devils_advocate_remarks": "${devilsAdvocateMode ? "strict, no-nonsense feedback" : "balanced feedback"}",
  "confidence_scores": {
    "pointer_accuracy": 0.0-1.0,
    "similarity_detection": 0.0-1.0
  }
}
`;

    const response = await this.callPerplexity(analysisPrompt);

    try {
      const cleanedResponse = this.extractJSONFromMarkdown(response);
      console.log("Cleaned JSON response:", cleanedResponse.substring(0, 200) + "...");
      const parsed = JSON.parse(cleanedResponse);
      return parsed as AIAnalysis;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      console.error("Raw Perplexity response:", response);
      console.error("Response length:", response.length);
      console.error("Response type:", typeof response);

      // Throw the error so we can see what Perplexity actually returned
      throw new Error(`Perplexity API returned invalid JSON. Response: ${response.substring(0, 500)}...`);
    }
  }

  static async generateSDE2Questions(topics: string[]): Promise<SuggestedQuestion[]> {
    const questionsPrompt = `
Generate 10 high-impact SDE-2 interview questions focusing on these topics: ${topics.join(", ")}.

Include a mix of:
- Data Structures & Algorithms (medium-hard)
- Low Level Design
- System Design (entry-level)
- Behavioral questions
- Coding challenges

Respond in JSON format:
{
  "questions": [
    {
      "question": "specific question text",
      "topic": "DSA|LLD|System Design|Behavioral|Coding|Architecture",
      "difficulty": "Easy|Medium|Hard",
      "source": "optional source or company"
    }
  ]
}
`;

    const response = await this.callPerplexity(questionsPrompt);

    try {
      const cleanedResponse = this.extractJSONFromMarkdown(response);
      const parsed = JSON.parse(cleanedResponse);
      return parsed.questions || [];
    } catch (error) {
      console.error("Failed to parse questions response:", error);
      console.error("Raw questions response:", response);
      return [];
    }
  }

  static async validateCompletedPointer(
    pointer: Pointer,
    newFeedback: string
  ): Promise<{ confidence: number; comment: string }> {
    const validationPrompt = `
A pointer was marked as completed: "${pointer.title}"
Action steps taken: "${pointer.action_steps}"

New feedback received: "${newFeedback}"

Based on this new feedback, assess if the completed pointer is truly resolved.
Provide confidence score (0-1) and brief comment.

Respond in JSON:
{
  "confidence": 0.0-1.0,
  "comment": "brief assessment of whether the pointer is truly resolved"
}
`;

    const response = await this.callPerplexity(validationPrompt);

    try {
      const cleanedResponse = this.extractJSONFromMarkdown(response);
      const parsed = JSON.parse(cleanedResponse);
      return {
        confidence: parsed.confidence || 0.5,
        comment: parsed.comment || "Unable to validate completion.",
      };
    } catch (error) {
      console.error("Failed to parse validation response:", error);
      console.error("Raw validation response:", response);
      return {
        confidence: 0.5,
        comment: "Validation analysis failed.",
      };
    }
  }
}
