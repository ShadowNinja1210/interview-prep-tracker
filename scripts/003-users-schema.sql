-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add user_id to existing tables
ALTER TABLE pointers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE pointer_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE feedback_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for user_id
CREATE INDEX IF NOT EXISTS idx_pointers_user_id ON pointers(user_id);
CREATE INDEX IF NOT EXISTS idx_pointer_history_user_id ON pointer_history(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_sessions_user_id ON feedback_sessions(user_id);

-- Insert sample users (password is "password123" for demo)
INSERT INTO users (email, name, password_hash) VALUES
    ('john@example.com', 'John Doe', 'password123'),
    ('jane@example.com', 'Jane Smith', 'password123'),
    ('bob@example.com', 'Bob Johnson', 'password123')
ON CONFLICT (email) DO NOTHING; 