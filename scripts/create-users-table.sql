-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample users
INSERT INTO users (email, name, password_hash) VALUES
    ('john@example.com', 'John Doe', 'password123'),
    ('jane@example.com', 'Jane Smith', 'password123'),
    ('bob@example.com', 'Bob Johnson', 'password123')
ON CONFLICT (email) DO NOTHING; 