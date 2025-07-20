DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'topic_enum') THEN
    CREATE TYPE topic_enum AS ENUM ('DSA', 'LLD', 'System Design', 'Behavioral', 'Coding', 'Architecture');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
    CREATE TYPE status_enum AS ENUM ('not_started', 'in_progress', 'completed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_type_enum') THEN
    CREATE TYPE change_type_enum AS ENUM ('updated', 'marked_complete', 'reopened', 'created');
  END IF;
END
$$;

CREATE TABLE pointers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic topic_enum NOT NULL,
    status status_enum DEFAULT 'not_started',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP NULL,
    weightage INTEGER DEFAULT 1 CHECK (weightage >= 1 AND weightage <= 10),
    feedback_summary TEXT,
    action_steps TEXT
);

CREATE TABLE pointer_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pointer_id UUID REFERENCES pointers(id) ON DELETE CASCADE,
    updated_at TIMESTAMP DEFAULT NOW(),
    change_type change_type_enum NOT NULL,
    ai_reasoning TEXT,
    similarity_score FLOAT,
    remarks TEXT,
    previous_status status_enum,
    new_status status_enum
);

CREATE TABLE feedback_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_feedback TEXT NOT NULL,
    parsed_pointers JSONB,
    submitted_at TIMESTAMP DEFAULT NOW(),
    ai_comments TEXT,
    devils_advocate_enabled BOOLEAN DEFAULT FALSE,
    performance_score FLOAT,
    suggested_questions JSONB
);

CREATE INDEX idx_pointers_topic ON pointers(topic);
CREATE INDEX idx_pointers_status ON pointers(status);
CREATE INDEX idx_pointers_created_at ON pointers(created_at);
CREATE INDEX idx_pointer_history_pointer_id ON pointer_history(pointer_id);
CREATE INDEX idx_feedback_sessions_submitted_at ON feedback_sessions(submittenum AS ENUM ('DSA', 'LLD', 'System Design', 'Behavioral', d_at);

CREATE INDEX idx_pointers_title_fts ON pointers USING gin(to_tsvector('english', title));
CREATE INDEX idx_pointers_action_steps_fts ON pointers USING gin(to_tsvector('english', COALESCE(action_steps, '')));


CREATE TYPE IF NOT EXISTS public.topi'Coding', 'Architecture');
CREATE TYPE IF NOT EXISTS public.status_enum AS ENUM ('not_started', 'in_progress', 'completed');