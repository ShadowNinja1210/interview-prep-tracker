"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Database } from "@/lib/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, Target, Award, AlertTriangle } from "lucide-react";
import { ProgressMetrics } from "@/lib/types";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export function ProgressDashboard() {
  const { progressMetrics, setProgressMetrics } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      console.log("Loading progress metrics from API...");
      const response = await fetch("/api/progress");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Progress API response:", data);

      if (data.success) {
        setProgressMetrics(data.metrics as ProgressMetrics);
        console.log("Loaded progress metrics:", {
          total_pointers: data.metrics.total_pointers,
          completed_pointers: data.metrics.completed_pointers,
          completion_rate: data.metrics.completion_rate,
        });
      } else {
        throw new Error(data.error || "Failed to load progress metrics");
      }
    } catch (error) {
      console.error("Failed to load progress metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !progressMetrics) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const topicChartData = Object.entries(progressMetrics.topic_breakdown).map(([topic, data]) => ({
    topic,
    total: data.total,
    completed: data.completed,
    completion_rate: data.total > 0 ? (data.completed / data.total) * 100 : 0,
  }));

  const pieChartData = Object.entries(progressMetrics.topic_breakdown).map(([topic, data]) => ({
    name: topic,
    value: data.total,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pointers</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressMetrics.total_pointers}</div>
            <p className="text-xs text-muted-foreground">Active preparation items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressMetrics.completion_rate.toFixed(1)}%</div>
            <Progress value={progressMetrics.completion_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weighted Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressMetrics.weighted_score.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Based on pointer weights</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressMetrics.completed_pointers}/{progressMetrics.total_pointers}
            </div>
            <p className="text-xs text-muted-foreground">Finished vs total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Topic Completion Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topicChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    `${value}${name === "completion_rate" ? "%" : ""}`,
                    name === "completion_rate" ? "Completion Rate" : name === "completed" ? "Completed" : "Total",
                  ]}
                />
                <Bar dataKey="total" fill="#8884d8" name="total" />
                <Bar dataKey="completed" fill="#82ca9d" name="completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent ?? 0 * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Topic Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Topic Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(progressMetrics.topic_breakdown).map(([topic, data]) => (
              <div key={topic} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{topic}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {data.completed}/{data.total}
                  </span>
                </div>
                <Progress value={data.total > 0 ? (data.completed / data.total) * 100 : 0} className="mb-2" />
                <div className="text-sm text-muted-foreground">Score: {data.score} points</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {progressMetrics.plateau_warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Plateau Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {progressMetrics.plateau_warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {warning}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
