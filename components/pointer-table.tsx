"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Database } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Calendar, Target, TrendingUp, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Pointer, Topic, Status } from "@/lib/types";
import { EditPointerDialog } from "@/components/edit-pointer-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TOPICS: Topic[] = ["DSA", "LLD", "System Design", "Behavioral", "Coding", "Architecture"];
const STATUSES: Status[] = ["not_started", "in_progress", "completed"];

export function PointerTable() {
  const {
    pointers,
    setPointers,
    updatePointer,
    setSelectedPointer,
    topicFilter,
    statusFilter,
    setTopicFilter,
    setStatusFilter,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [editingPointer, setEditingPointer] = useState<Pointer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    loadPointers();
  }, []);

  const loadPointers = async () => {
    try {
      console.log("Loading pointers from API...");
      const response = await fetch("/api/pointers");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Pointers API response:", data);

      if (data.success) {
        setPointers(data.pointers);
        console.log("Loaded pointers count:", data.count);
      } else {
        throw new Error(data.error || "Failed to load pointers");
      }
    } catch (error) {
      console.error("Failed to load pointers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (pointer: Pointer) => {
    try {
      console.log("Marking pointer complete via API:", pointer.id);

      const response = await fetch(`/api/pointers/${pointer.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("Mark complete API response:", result);

      if (result.success) {
        // Update the pointer in the store
        updatePointer(pointer.id, result.pointer);

        // Refresh pointers from API
        const pointersResponse = await fetch("/api/pointers");
        if (pointersResponse.ok) {
          const pointersData = await pointersResponse.json();
          setPointers(pointersData.pointers);
        }
      } else {
        throw new Error(result.error || "Failed to mark pointer complete");
      }
    } catch (error) {
      console.error("Failed to mark pointer complete:", error);
    }
  };

  const handleEditPointer = (pointer: Pointer) => {
    setEditingPointer(pointer);
    setIsEditDialogOpen(true);
  };

  const handleDeletePointer = async (pointer: Pointer) => {
    try {
      const response = await fetch(`/api/pointers/${pointer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Refresh pointers from API
      await loadPointers();
    } catch (error) {
      console.error("Failed to delete pointer:", error);
    }
  };

  const handlePointerUpdated = () => {
    loadPointers();
  };

  const filteredPointers = pointers.filter((pointer) => {
    const topicMatch = topicFilter === "all" || pointer.topic === topicFilter;
    const statusMatch = statusFilter === "all" || pointer.status === statusFilter;
    return topicMatch && statusMatch;
  });

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getTopicColor = (topic: Topic) => {
    const colors = {
      DSA: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      LLD: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "System Design": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      Behavioral: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
      Coding: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
      Architecture: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
    };
    return colors[topic];
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

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Preparation Pointers ({filteredPointers.length})
            </CardTitle>
            <div className="flex gap-2">
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {TOPICS.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">✓</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPointers.map((pointer) => (
                <TableRow key={pointer.id}>
                  <TableCell>
                    <Checkbox
                      checked={pointer.status === "completed"}
                      onCheckedChange={() => {
                        if (pointer.status !== "completed") {
                          handleMarkComplete(pointer);
                        }
                      }}
                      disabled={pointer.status === "completed"}
                    />
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate" title={pointer.title}>
                      {pointer.title}
                    </div>
                    {pointer.feedback_summary && (
                      <div className="text-sm text-muted-foreground truncate mt-1">{pointer.feedback_summary}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getTopicColor(pointer.topic)}>{pointer.topic}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(pointer.status)}>
                      {pointer.status.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      {pointer.weightage}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(pointer.created_at), "MMM dd")}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pointer.completed_at ? (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(pointer.completed_at), "MMM dd")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedPointer(pointer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditPointer(pointer)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Pointer</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{pointer.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePointer(pointer)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredPointers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No pointers found. Submit feedback to get started!
            </div>
          )}
        </CardContent>
      </Card>

      <EditPointerDialog
        pointer={editingPointer}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onPointerUpdated={handlePointerUpdated}
      />
    </>
  );
}
