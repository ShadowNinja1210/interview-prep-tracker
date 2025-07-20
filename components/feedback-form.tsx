"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppStore } from "@/lib/store";
import { Database } from "@/lib/database";
import { AIService } from "@/lib/ai-service";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Brain, MessageSquare, Loader2 } from "lucide-react";
import type { ParsedPointer } from "@/lib/types";

const feedbackSchema = z.object({
  feedback: z.string().min(10, "Feedback must be at least 10 characters long"),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

export function FeedbackForm() {
  const { pointers, devilsAdvocateMode, addFeedbackSession, setPointers, isAnalyzing, setIsAnalyzing } = useAppStore();

  const [aiSuggestions, setAiSuggestions] = useState<ParsedPointer[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [devilsAdvocateRemarks, setDevilsAdvocateRemarks] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [approvingPointer, setApprovingPointer] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback: "",
    },
  });

  const onSubmit = async (data: FeedbackForm) => {
    setIsAnalyzing(true);
    setErrorMessage(""); // Clear any previous errors
    try {
      // Call the API route instead of calling AIService directly
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: data.feedback,
          devilsAdvocateMode: devilsAdvocateMode,
        }),
      });

      // Get response text first, then parse
      const responseText = await response.text();

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}...`);
      }

      const { session, analysis, questions } = responseData;

      setAiSuggestions(analysis.suggestions);
      setAiAnalysis(analysis.performance_analysis);
      setDevilsAdvocateRemarks(analysis.devils_advocate_remarks);
      setShowSuggestions(true);

      // Session is already created by the API route
      addFeedbackSession(session);
    } catch (error) {
      console.error("Failed to analyze feedback:", error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to analyze feedback");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveSuggestion = async (suggestion: ParsedPointer) => {
    setApprovingPointer(suggestion.title);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      console.log("Approving suggestion:", suggestion.title);

      if (suggestion.is_update && suggestion.existing_pointer_id) {
        // Update existing pointer
        console.log("Updating existing pointer:", suggestion.existing_pointer_id);
        const updated = await Database.updatePointer(suggestion.existing_pointer_id, {
          title: suggestion.title,
          action_steps: suggestion.action_steps,
          feedback_summary: `Updated based on recent feedback`,
        });
        console.log("Updated pointer:", updated);

        // Add to history
        await Database.addPointerHistory({
          pointer_id: suggestion.existing_pointer_id,
          change_type: "updated",
          ai_reasoning: suggestion.ai_reasoning,
          similarity_score: suggestion.similarity_score,
          remarks: "AI-suggested update approved by user",
          previous_status: null,
          new_status: null,
        });
      } else {
        // Create new pointer via API route
        console.log("Creating new pointer via API:", suggestion.title);

        const response = await fetch("/api/pointers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pointer: {
              title: suggestion.title,
              topic: suggestion.topic,
              action_steps: suggestion.action_steps,
            },
            history: {
              ai_reasoning: suggestion.ai_reasoning,
              similarity_score: suggestion.similarity_score,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log("API response:", result);

        if (result.success) {
          // Refresh pointers from API
          console.log("Refreshing pointers from API...");
          const pointersResponse = await fetch("/api/pointers");
          if (pointersResponse.ok) {
            const pointersData = await pointersResponse.json();
            setPointers(pointersData.pointers);
            console.log("Updated pointers count:", pointersData.count);
          }

          // Remove suggestion from list
          setAiSuggestions((prev) => prev.filter((s) => s !== suggestion));

          // Show success message
          setSuccessMessage(`✅ "${suggestion.title}" has been added to your pointers!`);

          // Clear success message after 3 seconds
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          throw new Error(result.error || "Failed to create pointer");
        }
      }

      // Refresh pointers from API
      console.log("Refreshing pointers from API...");
      const pointersResponse = await fetch("/api/pointers");
      if (pointersResponse.ok) {
        const pointersData = await pointersResponse.json();
        setPointers(pointersData.pointers);
        console.log("Updated pointers count:", pointersData.count);
      }

      // Remove suggestion from list
      setAiSuggestions((prev) => prev.filter((s) => s !== suggestion));

      // Show success message
      setSuccessMessage(`✅ "${suggestion.title}" has been added to your pointers!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to apply suggestion:", error);
      setErrorMessage(`Failed to add pointer: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setApprovingPointer(null);
    }
  };

  const handleRejectSuggestion = (suggestion: ParsedPointer) => {
    setAiSuggestions((prev) => prev.filter((s) => s !== suggestion));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Submit Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Preparation Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your recent interview preparation session, what went well, what needs improvement, specific topics you struggled with, etc."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isAnalyzing} className="w-full">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Feedback...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze Feedback
                  </>
                )}
              </Button>
            </form>
          </Form>

          {errorMessage && (
            <Alert className="mt-4" variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mt-4" variant="default">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {showSuggestions && (
        <div className="space-y-4">
          {aiAnalysis && (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                <strong>Performance Analysis:</strong> {aiAnalysis}
              </AlertDescription>
            </Alert>
          )}

          {devilsAdvocateMode && devilsAdvocateRemarks && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Devil's Advocate:</strong> {devilsAdvocateRemarks}
              </AlertDescription>
            </Alert>
          )}

          {aiSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{suggestion.topic}</Badge>
                          <Badge variant={suggestion.is_update ? "secondary" : "default"}>
                            {suggestion.is_update ? "UPDATE" : "NEW"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Similarity: {(suggestion.similarity_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{suggestion.action_steps}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          <strong>AI Reasoning:</strong> {suggestion.ai_reasoning}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveSuggestion(suggestion)}
                        disabled={approvingPointer === suggestion.title}
                        className="flex items-center gap-1"
                      >
                        {approvingPointer === suggestion.title ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectSuggestion(suggestion)}
                        className="flex items-center gap-1"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
