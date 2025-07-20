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
          // Remove quotes if they exist
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

async function testConnection() {
  loadEnvFile();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not found");
    return;
  }

  console.log("🔌 Testing database connection...");
  const sql = neon(connectionString);

  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log("✅ Database connection successful!");
    console.log("Current time:", result[0].current_time);

    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;

    console.log(
      "📋 Existing tables:",
      tables.map((t) => t.table_name)
    );
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
}

testConnection();
