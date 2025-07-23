"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import type { Pointer, Topic, Status } from "@/lib/types";

interface EditPointerDialogProps {
  pointer: Pointer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPointerUpdated: () => void;
}

const topics: Topic[] = ["DSA", "LLD", "System Design", "Behavioral", "Coding", "Architecture"];
const statuses = ["not_started", "in_progress", "completed"] as const;

export function EditPointerDialog({ pointer, open, onOpenChange, onPointerUpdated }: EditPointerDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    topic: "DSA" as Topic,
    status: "not_started" as Status,
    weightage: 5,
    feedback_summary: "",
    action_steps: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (pointer) {
      setFormData({
        title: pointer.title,
        topic: pointer.topic,
        status: pointer.status,
        weightage: pointer.weightage,
        feedback_summary: pointer.feedback_summary || "",
        action_steps: pointer.action_steps || "",
      });
    }
  }, [pointer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pointer) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/pointers/${pointer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onPointerUpdated();
        onOpenChange(false);
      } else {
        setError(data.error || "Failed to update pointer");
      }
    } catch (error) {
      setError("An error occurred while updating the pointer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Pointer</DialogTitle>
          <DialogDescription>Update the details of your interview preparation pointer.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter pointer title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Select value={formData.topic} onValueChange={(value) => handleInputChange("topic", value as Topic)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weightage">Weightage (1-10)</Label>
            <Input
              id="weightage"
              type="number"
              min="1"
              max="10"
              value={formData.weightage}
              onChange={(e) => handleInputChange("weightage", parseInt(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback_summary">Feedback Summary</Label>
            <Textarea
              id="feedback_summary"
              value={formData.feedback_summary}
              onChange={(e) => handleInputChange("feedback_summary", e.target.value)}
              placeholder="Enter feedback or notes"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="action_steps">Action Steps</Label>
            <Textarea
              id="action_steps"
              value={formData.action_steps}
              onChange={(e) => handleInputChange("action_steps", e.target.value)}
              placeholder="Enter action steps or next steps"
              rows={3}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Pointer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
