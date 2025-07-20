import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { Pointer, FeedbackSession, ProgressMetrics } from "./types"

interface AppState {
  // Devil's Advocate Mode
  devilsAdvocateMode: boolean
  toggleDevilsAdvocateMode: () => void

  // Pointers
  pointers: Pointer[]
  setPointers: (pointers: Pointer[]) => void
  updatePointer: (id: string, updates: Partial<Pointer>) => void

  // Feedback Sessions
  feedbackSessions: FeedbackSession[]
  setFeedbackSessions: (sessions: FeedbackSession[]) => void
  addFeedbackSession: (session: FeedbackSession) => void

  // Progress Metrics
  progressMetrics: ProgressMetrics | null
  setProgressMetrics: (metrics: ProgressMetrics) => void

  // UI State
  selectedPointer: Pointer | null
  setSelectedPointer: (pointer: Pointer | null) => void
  isAnalyzing: boolean
  setIsAnalyzing: (analyzing: boolean) => void

  // Filters
  topicFilter: string
  statusFilter: string
  setTopicFilter: (topic: string) => void
  setStatusFilter: (status: string) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Devil's Advocate Mode
      devilsAdvocateMode: false,
      toggleDevilsAdvocateMode: () => set((state) => ({ devilsAdvocateMode: !state.devilsAdvocateMode })),

      // Pointers
      pointers: [],
      setPointers: (pointers) => set({ pointers }),
      updatePointer: (id, updates) =>
        set((state) => ({
          pointers: state.pointers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      // Feedback Sessions
      feedbackSessions: [],
      setFeedbackSessions: (sessions) => set({ feedbackSessions: sessions }),
      addFeedbackSession: (session) =>
        set((state) => ({
          feedbackSessions: [session, ...state.feedbackSessions],
        })),

      // Progress Metrics
      progressMetrics: null,
      setProgressMetrics: (metrics) => set({ progressMetrics: metrics }),

      // UI State
      selectedPointer: null,
      setSelectedPointer: (pointer) => set({ selectedPointer: pointer }),
      isAnalyzing: false,
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

      // Filters
      topicFilter: "all",
      statusFilter: "all",
      setTopicFilter: (topic) => set({ topicFilter: topic }),
      setStatusFilter: (status) => set({ statusFilter: status }),
    }),
    { name: "sde2-tracker-store" },
  ),
)
