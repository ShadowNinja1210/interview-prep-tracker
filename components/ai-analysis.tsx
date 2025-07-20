"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, MessageSquare, Calendar, TrendingUp, Eye, Target } from "lucide-react";
import { format } from "date-fns";
import type { FeedbackSession } from "@/lib/types";

export function AIAnalysis() {
  const [feedbackSessions, setFeedbackSessions] = useState<FeedbackSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<FeedbackSession | null>(null);

  useEffect(() => {
    loadFeedbackSessions();
  }, []);

  const loadFeedbackSessions = async () => {
    try {
      console.log("Loading feedback sessions from API...");
      const response = await fetch("/api/feedback-sessions");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Feedback sessions API response:", data);

      if (data.success) {
        setFeedbackSessions(data.sessions);
        console.log("Loaded feedback sessions count:", data.count);
      } else {
        throw new Error(data.error || "Failed to load feedback sessions");
      }
    } catch (error) {
      console.error("Failed to load feedback sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDevilsAdvocateColor = (enabled: boolean) => {
    return enabled
      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (feedbackSessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No AI Analysis Yet</h3>
            <p>Submit feedback to see AI analysis and suggestions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackSessions.length}</div>
            <p className="text-xs text-muted-foreground">Feedback analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {feedbackSessions.reduce((total, session) => total + (session.parsed_pointers?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pointers generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devil's Advocate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackSessions.filter((s) => s.devils_advocate_enabled).length}</div>
            <p className="text-xs text-muted-foreground">Strict analysis mode</p>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {feedbackSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getDevilsAdvocateColor(session.devils_advocate_enabled)}>
                        {session.devils_advocate_enabled ? "Devil's Advocate" : "Constructive"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(session.submitted_at), "PPp")}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Feedback:</strong> {session.raw_feedback.substring(0, 150)}
                      {session.raw_feedback.length > 150 && "..."}
                    </div>

                    {session.ai_comments && (
                      <Alert>
                        <Brain className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Performance Analysis:</strong> {session.ai_comments}
                        </AlertDescription>
                      </Alert>
                    )}

                    {session.parsed_pointers && session.parsed_pointers.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-medium mb-2">AI Suggestions ({session.parsed_pointers.length})</h4>
                        <div className="space-y-2">
                          {session.parsed_pointers.slice(0, 3).map((pointer, index) => (
                            <div key={index} className="text-sm p-2 bg-muted rounded">
                              <div className="font-medium">{pointer.title}</div>
                              <div className="text-muted-foreground text-xs">{pointer.topic}</div>
                            </div>
                          ))}
                          {session.parsed_pointers.length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              +{session.parsed_pointers.length - 3} more suggestions
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                      <Eye className="h-4 w-4" />
                      View Full Analysis
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const analysisText = `
AI Analysis Report - ${format(new Date(session.submitted_at), "PPP")}

PERFORMANCE ANALYSIS:
${session.ai_comments || "No analysis available"}

IMPROVEMENT SUGGESTIONS:
${
  session.parsed_pointers
    ?.map(
      (p, i) => `${i + 1}. ${p.title} (${p.topic})
   Action: ${p.action_steps}
   Reasoning: ${p.ai_reasoning}`
    )
    .join("\n\n") || "No suggestions available"
}

PRACTICE QUESTIONS:
${
  session.suggested_questions?.map((q, i) => `${i + 1}. ${q.question} (${q.topic} - ${q.difficulty})`).join("\n") ||
  "No questions available"
}
                        `.trim();
                        navigator.clipboard.writeText(analysisText);
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-6xl w-full max-h-[95vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">Complete AI Analysis Report</h2>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedSession.submitted_at), "PPP 'at' p")}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
                ×
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(95vh-120px)] p-6 space-y-6">
              {/* Analysis Mode */}
              <div className="flex items-center gap-2">
                <Badge className={getDevilsAdvocateColor(selectedSession.devils_advocate_enabled)}>
                  {selectedSession.devils_advocate_enabled ? "Devil's Advocate Mode" : "Constructive Analysis"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedSession.devils_advocate_enabled
                    ? "Strict, no-nonsense feedback"
                    : "Balanced, encouraging feedback"}
                </span>
              </div>

              {/* Original Feedback */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Original Feedback
                </h3>
                <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">{selectedSession.raw_feedback}</pre>
                </div>
              </div>

              {/* AI Performance Analysis */}
              {selectedSession.ai_comments && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Performance Analysis
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <p className="text-sm">{selectedSession.ai_comments}</p>
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {selectedSession.parsed_pointers && selectedSession.parsed_pointers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    AI-Generated Improvement Suggestions ({selectedSession.parsed_pointers.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedSession.parsed_pointers.map((pointer, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{pointer.topic}</Badge>
                            <Badge variant="secondary">
                              Similarity: {(pointer.similarity_score * 100).toFixed(0)}%
                            </Badge>
                            {pointer.is_update && <Badge variant="destructive">UPDATE</Badge>}
                          </div>
                          <span className="text-xs text-muted-foreground">#{index + 1}</span>
                        </div>

                        <h4 className="font-semibold text-lg mb-2">{pointer.title}</h4>

                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Action Steps:</h5>
                            <p className="text-sm text-muted-foreground">{pointer.action_steps}</p>
                          </div>

                          {pointer.ai_reasoning && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">AI Reasoning:</h5>
                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                {pointer.ai_reasoning}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Practice Questions */}
              {selectedSession.suggested_questions && selectedSession.suggested_questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Recommended Practice Questions ({selectedSession.suggested_questions.length})
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedSession.suggested_questions.map((question, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{question.topic}</Badge>
                          <Badge variant="secondary">{question.difficulty}</Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{question.question}</p>
                        {question.source && <p className="text-xs text-muted-foreground">Source: {question.source}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    // Copy analysis to clipboard
                    const analysisText = `
AI Analysis Report - ${format(new Date(selectedSession.submitted_at), "PPP")}

PERFORMANCE ANALYSIS:
${selectedSession.ai_comments || "No analysis available"}

IMPROVEMENT SUGGESTIONS:
${
  selectedSession.parsed_pointers
    ?.map(
      (p, i) => `${i + 1}. ${p.title} (${p.topic})
   Action: ${p.action_steps}
   Reasoning: ${p.ai_reasoning}`
    )
    .join("\n\n") || "No suggestions available"
}

PRACTICE QUESTIONS:
${
  selectedSession.suggested_questions
    ?.map((q, i) => `${i + 1}. ${q.question} (${q.topic} - ${q.difficulty})`)
    .join("\n") || "No questions available"
}
                    `.trim();
                    navigator.clipboard.writeText(analysisText);
                  }}
                >
                  Copy Analysis
                </Button>
                <Button variant="outline" onClick={() => setSelectedSession(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
