const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, "..", ".env.local");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf8");
      envContent.split("\n").forEach((line) => {
        line = line.trim();
        if (line && !line.startsWith("#") && line.includes("=")) {
          const [key, ...values] = line.split("=");
          let value = values.join("=").trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key.trim()] = value;
        }
      });
      console.log("✅ Loaded environment variables from .env.local");
    }
  } catch (error) {
    console.log("⚠️  Could not load .env.local:", error.message);
  }
}

async function setupDatabase() {
  loadEnvFile();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not found");
    process.exit(1);
  }

  console.log("🔌 Connecting to database...");
  const sql = neon(connectionString);

  try {
    // Define statements in the correct order
    console.log("📋 Creating ENUM types...");

    await sql`CREATE TYPE topic_enum AS ENUM ('DSA', 'LLD', 'System Design', 'Behavioral', 'Coding', 'Architecture')`;
    console.log("✅ Created topic_enum");

    await sql`CREATE TYPE status_enum AS ENUM ('not_started', 'in_progress', 'completed')`;
    console.log("✅ Created status_enum");

    await sql`CREATE TYPE change_type_enum AS ENUM ('updated', 'marked_complete', 'reopened', 'created')`;
    console.log("✅ Created change_type_enum");

    console.log("📋 Creating tables...");

    // Create pointers table
    await sql`
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
      )
    `;
    console.log("✅ Created pointers table");

    // Create pointer_history table
    await sql`
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
      )
    `;
    console.log("✅ Created pointer_history table");

    // Create feedback_sessions table
    await sql`
      CREATE TABLE feedback_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        raw_feedback TEXT NOT NULL,
        parsed_pointers JSONB,
        submitted_at TIMESTAMP DEFAULT NOW(),
        ai_comments TEXT,
        devils_advocate_enabled BOOLEAN DEFAULT FALSE,
        performance_score FLOAT,
        suggested_questions JSONB
      )
    `;
    console.log("✅ Created feedback_sessions table");

    console.log("📋 Creating indexes...");

    // Create indexes
    await sql`CREATE INDEX idx_pointers_topic ON pointers(topic)`;
    await sql`CREATE INDEX idx_pointers_status ON pointers(status)`;
    await sql`CREATE INDEX idx_pointers_created_at ON pointers(created_at)`;
    await sql`CREATE INDEX idx_pointer_history_pointer_id ON pointer_history(pointer_id)`;
    await sql`CREATE INDEX idx_feedback_sessions_submitted_at ON feedback_sessions(submitted_at)`;

    // Create full-text search indexes
    await sql`CREATE INDEX idx_pointers_title_fts ON pointers USING gin(to_tsvector('english', title))`;
    await sql`CREATE INDEX idx_pointers_action_steps_fts ON pointers USING gin(to_tsvector('english', COALESCE(action_steps, '')))`;

    console.log("✅ Created all indexes");

    console.log("📊 Inserting sample data...");

    // Insert sample data
    const sampleDataSQL = fs.readFileSync(path.join(__dirname, "002-sample-data.sql"), "utf8");

    // For sample data, we can execute it as one block since it's mostly INSERT statements
    await sql`${sampleDataSQL}`;

    console.log("✅ Sample data inserted successfully");
    console.log("🎉 Database setup complete!");
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

setupDatabase();
