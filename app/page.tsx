import { Suspense } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { UserHeader } from "@/components/user-header";
import { PointerTable } from "@/components/pointer-table";
import { FeedbackForm } from "@/components/feedback-form";
import { ProgressDashboard } from "@/components/progress-dashboard";
import { AIAnalysis } from "@/components/ai-analysis";
import { PointerDetailDrawer } from "@/components/pointer-detail-drawer";
import { DevilsAdvocateToggle } from "@/components/devils-advocate-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Target, TrendingUp, MessageSquare } from "lucide-react";

function LoadingCard() {
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

export default function HomePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <UserHeader />

        <div className="container mx-auto py-8 space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Your Interview Preparation Dashboard</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered coaching system to track, analyze, and optimize your interview preparation with strict,
              data-driven insights.
            </p>
          </div>

          <DevilsAdvocateToggle />

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="pointers" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pointers
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <Suspense fallback={<LoadingCard />}>
                <ProgressDashboard />
              </Suspense>
            </TabsContent>

            <TabsContent value="pointers">
              <Suspense fallback={<LoadingCard />}>
                <PointerTable />
              </Suspense>
            </TabsContent>

            <TabsContent value="feedback">
              <FeedbackForm />
            </TabsContent>

            <TabsContent value="analysis">
              <Suspense fallback={<LoadingCard />}>
                <AIAnalysis />
              </Suspense>
            </TabsContent>
          </Tabs>

          <PointerDetailDrawer />
        </div>
      </div>
    </ProtectedRoute>
  );
}
