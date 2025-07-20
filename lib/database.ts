import { neon } from "@neondatabase/serverless";
import type { Pointer, PointerHistory, FeedbackSession, Topic } from "./types";

// 👇 NEW util to know if we're on the server
const isServer = typeof window === "undefined";

// 👇 Wrap connection logic so it only runs on the server
const connectionString = isServer
  ? process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NO_SSL
  : undefined;

// 👇 Create a real Neon client on the server, fall back to a dummy client in the browser
const sql: ReturnType<typeof neon> | null = isServer
  ? (() => {
      if (!connectionString) {
        throw new Error(
          "❌  Database connection string not found. Please set DATABASE_URL or a compatible Postgres env var."
        );
      }
      return neon(connectionString);
    })()
  : null;

export class Database {
  // Pointers
  static async getPointers(): Promise<Pointer[]> {
    if (!sql) {
      // Browser fallback – return an empty array / noop so the preview doesn't crash
      return [];
    }
    const result = await sql`
      SELECT * FROM pointers 
      ORDER BY created_at DESC
    `;
    return result as Pointer[];
  }

  static async createPointer(pointer: Omit<Pointer, "id" | "created_at" | "completed_at">): Promise<Pointer> {
    if (!sql) {
      console.warn("DB write attempted in the browser preview – ignored.");
      return { ...pointer, id: crypto.randomUUID(), created_at: new Date().toISOString(), completed_at: null };
    }
    const result = await sql`
      INSERT INTO pointers (title, topic, status, weightage, feedback_summary, action_steps)
      VALUES (${pointer.title}, ${pointer.topic}, ${pointer.status}, ${pointer.weightage}, ${pointer.feedback_summary}, ${pointer.action_steps})
      RETURNING *
    `;
    // Fix: result may be an array of objects or a nested array, depending on the driver.
    // Try to handle both cases robustly.
    if (Array.isArray(result)) {
      if (result.length > 0 && typeof result[0] === "object" && result[0] !== null && !Array.isArray(result[0])) {
        // result is an array of objects
        return result[0] as Pointer;
      } else if (result.length > 0 && Array.isArray(result[0]) && result[0].length > 0) {
        // result is a nested array (e.g., [[row]])
        return result[0][0] as Pointer;
      }
    }
    throw new Error("Unexpected result format from database insert.");
  }

  static async updatePointer(id: string, updates: Partial<Pointer>): Promise<Pointer> {
    if (!sql) {
      console.warn("DB write attempted in the browser preview – ignored.");
      return { id, ...updates, created_at: new Date().toISOString(), completed_at: null } as Pointer;
    }
    const setClause = Object.entries(updates)
      .filter(([_, value]) => value !== undefined)
      .map(([key, _]) => `${key} = $${key}`)
      .join(", ");

    const result = await sql`
      UPDATE pointers 
      SET ${sql.unsafe(setClause)}
      WHERE id = ${id}
      RETURNING *
    `;
    // Fix: result may be an array of objects or a nested array, depending on the driver.
    if (Array.isArray(result)) {
      if (result.length > 0 && typeof result[0] === "object" && result[0] !== null && !Array.isArray(result[0])) {
        // result is an array of objects
        return result[0] as Pointer;
      } else if (result.length > 0 && Array.isArray(result[0]) && result[0].length > 0) {
        // result is a nested array (e.g., [[row]])
        return result[0][0] as Pointer;
      }
    }
    throw new Error("Unexpected result format from database update.");
  }

  static async markPointerComplete(id: string): Promise<Pointer> {
    if (!sql) {
      console.warn("DB write attempted in the browser preview – ignored.");
      return { id, status: "completed", completed_at: new Date().toISOString() } as Pointer;
    }
    const result = await sql`
      UPDATE pointers 
      SET status = 'completed', completed_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    // Fix: result may be an array of objects or a nested array, depending on the driver.
    if (Array.isArray(result)) {
      if (result.length > 0 && typeof result[0] === "object" && result[0] !== null && !Array.isArray(result[0])) {
        // result is an array of objects
        return result[0] as Pointer;
      } else if (result.length > 0 && Array.isArray(result[0]) && result[0].length > 0) {
        // result is a nested array (e.g., [[row]])
        return result[0][0] as Pointer;
      }
    }
    throw new Error("Unexpected result format from database update.");
  }

  // Pointer History
  static async addPointerHistory(history: Omit<PointerHistory, "id" | "updated_at">): Promise<PointerHistory> {
    if (!sql) {
      console.warn("DB write attempted in the browser preview – ignored.");
      return { ...history, id: crypto.randomUUID(), updated_at: new Date().toISOString() } as PointerHistory;
    }
    const result = await sql`
      INSERT INTO pointer_history (pointer_id, change_type, ai_reasoning, similarity_score, remarks, previous_status, new_status)
      VALUES (${history.pointer_id}, ${history.change_type}, ${history.ai_reasoning}, ${history.similarity_score}, ${history.remarks}, ${history.previous_status}, ${history.new_status})
      RETURNING *
    `;
    // Fix: result may be an array of objects or a nested array, depending on the driver.
    if (Array.isArray(result)) {
      if (result.length > 0 && typeof result[0] === "object" && result[0] !== null && !Array.isArray(result[0])) {
        // result is an array of objects
        return result[0] as PointerHistory;
      } else if (result.length > 0 && Array.isArray(result[0]) && result[0].length > 0) {
        // result is a nested array (e.g., [[row]])
        return result[0][0] as PointerHistory;
      }
    }
    throw new Error("Unexpected result format from database insert.");
  }

  static async getPointerHistory(pointerId: string): Promise<PointerHistory[]> {
    if (!sql) {
      // Browser fallback – return an empty array / noop so the preview doesn't crash
      return [];
    }
    const result = await sql`
      SELECT * FROM pointer_history 
      WHERE pointer_id = ${pointerId}
      ORDER BY updated_at DESC
    `;
    return result as PointerHistory[];
  }

  // Feedback Sessions
  static async createFeedbackSession(session: Omit<FeedbackSession, "id" | "submitted_at">): Promise<FeedbackSession> {
    if (!sql) {
      console.warn("DB write attempted in the browser preview – ignored.");
      return { ...session, id: crypto.randomUUID(), submitted_at: new Date().toISOString() } as FeedbackSession;
    }

    const stringifiedPointers = JSON.stringify(session.parsed_pointers);
    const stringifiedQuestions = JSON.stringify(session.suggested_questions);

    const result = await sql`
      INSERT INTO feedback_sessions (raw_feedback, parsed_pointers, ai_comments, devils_advocate_enabled, performance_score, suggested_questions)
      VALUES (${session.raw_feedback}, ${stringifiedPointers}, ${session.ai_comments}, ${session.devils_advocate_enabled}, ${session.performance_score}, ${stringifiedQuestions})
      RETURNING *
    `;
    // Ensure result is a single FeedbackSession object, not an array or special query result object
    let row: any;
    if (Array.isArray(result)) {
      if (result.length > 0 && typeof result[0] === "object" && result[0] !== null && !Array.isArray(result[0])) {
        // result is an array of objects
        row = result[0];
      } else if (result.length > 0 && Array.isArray(result[0]) && result[0].length > 0) {
        // result is a nested array (e.g., [[row]])
        row = result[0][0];
      }
    }
    if (!row) {
      throw new Error("Unexpected result format from database insert.");
    }

    return {
      ...row,
      // Neon automatically parses JSON columns, so we don't need to parse again
      parsed_pointers: row.parsed_pointers || null,
      suggested_questions: row.suggested_questions || null,
    } as FeedbackSession;
  }

  static async getFeedbackSessions(): Promise<FeedbackSession[]> {
    if (!sql) {
      return [];
    }
    const result = await sql`
      SELECT * FROM feedback_sessions 
      ORDER BY submitted_at DESC
    `;
    // Ensure result is an array of records, not a special query result object
    const rows = Array.isArray(result) ? result : [];
    return rows.map((session: any) => ({
      ...session,
      // Neon automatically parses JSON columns, so we don't need to parse again
      parsed_pointers: session.parsed_pointers || null,
      suggested_questions: session.suggested_questions || null,
    })) as FeedbackSession[];
  }

  // Analytics
  static async getProgressMetrics() {
    if (!sql) {
      return {
        total_pointers: 0,
        completed_pointers: 0,
        completion_rate: 0,
        weighted_score: 0,
        topic_breakdown: {},
        recent_activity: 0,
        plateau_warnings: [],
      };
    }
    const pointers = await this.getPointers();
    const totalPointers = pointers.length;
    const completedPointers = pointers.filter((p) => p.status === "completed").length;

    const topicBreakdown = pointers.reduce((acc, pointer) => {
      if (!acc[pointer.topic]) {
        acc[pointer.topic] = { total: 0, completed: 0, score: 0 };
      }
      acc[pointer.topic].total++;
      if (pointer.status === "completed") {
        acc[pointer.topic].completed++;
      }
      acc[pointer.topic].score += pointer.weightage;
      return acc;
    }, {} as Record<Topic, { total: number; completed: number; score: number }>);

    const weightedScore =
      (pointers.reduce((acc, pointer) => {
        return acc + (pointer.status === "completed" ? pointer.weightage : 0);
      }, 0) /
        pointers.reduce((acc, pointer) => acc + pointer.weightage, 0)) *
      100;

    return {
      total_pointers: totalPointers,
      completed_pointers: completedPointers,
      completion_rate: totalPointers > 0 ? (completedPointers / totalPointers) * 100 : 0,
      weighted_score: isNaN(weightedScore) ? 0 : weightedScore,
      topic_breakdown: topicBreakdown,
      recent_activity: 0, // TODO: Calculate based on recent updates
      plateau_warnings: [], // TODO: Identify stale pointers
    };
  }

  static async findSimilarPointers(
    title: string,
    embedding?: number[] // Keep for compatibility but don't use
  ): Promise<Array<Pointer & { similarity: number }>> {
    if (!sql) {
      return [];
    }
    // Use PostgreSQL's full-text search for semantic similarity
    const result = await sql`
      SELECT *, 
        CASE 
          WHEN LOWER(title) = LOWER(${title}) THEN 1.0
          WHEN ts_rank(to_tsvector('english', title), plainto_tsquery('english', ${title})) > 0 THEN 
            ts_rank(to_tsvector('english', title), plainto_tsquery('english', ${title})) + 0.3
          WHEN LOWER(title) LIKE LOWER(${"%" + title + "%"}) THEN 0.8
          WHEN LOWER(${title}) LIKE LOWER('%' + title + '%') THEN 0.6
          WHEN ts_rank(to_tsvector('english', COALESCE(action_steps, '')), plainto_tsquery('english', ${title})) > 0 THEN
            ts_rank(to_tsvector('english', COALESCE(action_steps, '')), plainto_tsquery('english', ${title})) + 0.2
          ELSE 0.0
        END as similarity
      FROM pointers 
      WHERE 
        LOWER(title) LIKE LOWER(${"%" + title + "%"}) 
        OR LOWER(${title}) LIKE LOWER('%' + title + '%')
        OR to_tsvector('english', title) @@ plainto_tsquery('english', ${title})
        OR to_tsvector('english', COALESCE(action_steps, '')) @@ plainto_tsquery('english', ${title})
      ORDER BY similarity DESC
      LIMIT 5
    `;

    // Ensure result is an array of objects before filtering
    const rows =
      Array.isArray(result) && result.length > 0 && !Array.isArray(result[0])
        ? result
        : Array.isArray(result) && Array.isArray(result[0]) && result[0].length === 0
        ? []
        : (result as Record<string, any>[]);

    return (rows as Array<Pointer & { similarity: number }>).filter(
      (r) => typeof r.similarity === "number" && r.similarity > 0
    );
  }
}
