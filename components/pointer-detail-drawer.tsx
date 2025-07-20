"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Database } from "@/lib/database";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, TrendingUp, History, Brain } from "lucide-react";
import { format } from "date-fns";
import type { PointerHistory } from "@/lib/types";

export function PointerDetailDrawer() {
  const { selectedPointer, setSelectedPointer } = useAppStore();
  const [history, setHistory] = useState<PointerHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedPointer) {
      loadHistory();
    }
  }, [selectedPointer]);

  const loadHistory = async () => {
    if (!selectedPointer) return;

    setLoading(true);
    try {
      console.log("Loading pointer history from API:", selectedPointer.id);
      const response = await fetch(`/api/pointers/${selectedPointer.id}/history`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Pointer history API response:", data);

      if (data.success) {
        setHistory(data.history);
        console.log("Loaded pointer history count:", data.count);
      } else {
        throw new Error(data.error || "Failed to load pointer history");
      }
    } catch (error) {
      console.error("Failed to load pointer history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "created":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "updated":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "marked_complete":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "reopened":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (!selectedPointer) return null;

  return (
    <Sheet open={!!selectedPointer} onOpenChange={() => setSelectedPointer(null)}>
      <SheetContent className="w-[600px] sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle className="text-left">{selectedPointer.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{selectedPointer.topic}</Badge>
              <Badge className={getStatusColor(selectedPointer.status)}>
                {selectedPointer.status.replace("_", " ").toUpperCase()}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Weight: {selectedPointer.weightage}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Created
                </div>
                <div>{format(new Date(selectedPointer.created_at), "PPP")}</div>
              </div>
              {selectedPointer.completed_at && (
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Completed
                  </div>
                  <div>{format(new Date(selectedPointer.completed_at), "PPP")}</div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Feedback Summary */}
          {selectedPointer.feedback_summary && (
            <div>
              <h4 className="font-medium mb-2">Feedback Summary</h4>
              <p className="text-sm text-muted-foreground">{selectedPointer.feedback_summary}</p>
            </div>
          )}

          {/* Action Steps */}
          {selectedPointer.action_steps && (
            <div>
              <h4 className="font-medium mb-2">Action Steps</h4>
              <p className="text-sm text-muted-foreground">{selectedPointer.action_steps}</p>
            </div>
          )}

          <Separator />

          {/* History Timeline */}
          <div>
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <History className="h-4 w-4" />
              History Timeline
            </h4>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-muted pl-4 pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getChangeTypeColor(entry.change_type)}>
                          {entry.change_type.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.updated_at), "PPp")}
                        </span>
                        {entry.similarity_score && (
                          <span className="text-xs text-muted-foreground">
                            Similarity: {(entry.similarity_score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>

                      {entry.remarks && <p className="text-sm mb-2">{entry.remarks}</p>}

                      {entry.ai_reasoning && (
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Brain className="h-3 w-3" />
                            AI Reasoning
                          </div>
                          <p className="text-xs">{entry.ai_reasoning}</p>
                        </div>
                      )}
                    </div>
                  ))}

                  {history.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No history available</div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
