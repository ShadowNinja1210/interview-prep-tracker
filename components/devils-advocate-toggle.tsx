"use client"

import { useAppStore } from "@/lib/store"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Brain } from "lucide-react"

export function DevilsAdvocateToggle() {
  const { devilsAdvocateMode, toggleDevilsAdvocateMode } = useAppStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {devilsAdvocateMode ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : (
            <Brain className="h-5 w-5 text-blue-500" />
          )}
          AI Coach Mode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch id="devils-advocate" checked={devilsAdvocateMode} onCheckedChange={toggleDevilsAdvocateMode} />
          <Label htmlFor="devils-advocate" className="flex-1">
            {devilsAdvocateMode ? (
              <div>
                <div className="font-medium text-red-600">Devil's Advocate Mode</div>
                <div className="text-sm text-muted-foreground">Strict, analytical feedback without sugar-coating</div>
              </div>
            ) : (
              <div>
                <div className="font-medium text-blue-600">Constructive Mode</div>
                <div className="text-sm text-muted-foreground">
                  Balanced, encouraging feedback with actionable insights
                </div>
              </div>
            )}
          </Label>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted">
          <p className="text-sm text-muted-foreground">
            {devilsAdvocateMode
              ? "⚠️ AI will provide brutally honest analysis, identify weaknesses without mercy, and challenge your preparation rigorously."
              : "💡 AI will provide constructive feedback, highlight both strengths and areas for improvement, and offer supportive guidance."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
