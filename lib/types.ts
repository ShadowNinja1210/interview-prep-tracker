export type Topic = "DSA" | "LLD" | "System Design" | "Behavioral" | "Coding" | "Architecture"
export type Status = "not_started" | "in_progress" | "completed"
export type ChangeType = "updated" | "marked_complete" | "reopened" | "created"

export interface Pointer {
  id: string
  title: string
  topic: Topic
  status: Status
  created_at: string
  completed_at: string | null
  weightage: number
  feedback_summary: string | null
  action_steps: string | null
}

export interface PointerHistory {
  id: string
  pointer_id: string
  updated_at: string
  change_type: ChangeType
  ai_reasoning: string | null
  similarity_score: number | null
  remarks: string | null
  previous_status: Status | null
  new_status: Status | null
}

export interface FeedbackSession {
  id: string
  raw_feedback: string
  parsed_pointers: ParsedPointer[] | null
  submitted_at: string
  ai_comments: string | null
  devils_advocate_enabled: boolean
  performance_score: number | null
  suggested_questions: SuggestedQuestion[] | null
}

export interface ParsedPointer {
  title: string
  topic: Topic
  action_steps: string
  similarity_score: number
  existing_pointer_id?: string
  ai_reasoning: string
  is_update: boolean
}

export interface SuggestedQuestion {
  question: string
  topic: Topic
  difficulty: "Easy" | "Medium" | "Hard"
  source?: string
}

export interface AIAnalysis {
  suggestions: ParsedPointer[]
  performance_analysis: string
  devils_advocate_remarks: string
  confidence_scores: Record<string, number>
}

export interface ProgressMetrics {
  total_pointers: number
  completed_pointers: number
  completion_rate: number
  weighted_score: number
  topic_breakdown: Record<Topic, { total: number; completed: number; score: number }>
  recent_activity: number
  plateau_warnings: string[]
}
