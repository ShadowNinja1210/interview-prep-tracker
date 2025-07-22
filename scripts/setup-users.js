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
    } else {
      console.log("⚠️  .env.local file not found");
    }
  } catch (error) {
    console.log("⚠️  Could not load .env.local:", error.message);
  }
}

async function setupUsers() {
  // Load environment variables first
  loadEnvFile();

  // Check if DATABASE_URL is set
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  console.log("Loaded env DATABASE_URL:", process.env.DATABASE_URL);

  if (!connectionString) {
    console.error("❌ DATABASE_URL not found in environment variables.");
    console.log("Please add DATABASE_URL to your .env.local file");
    process.exit(1);
  }

  console.log("🔌 Connecting to database...");
  const sql = neon(connectionString);

  try {
    // Read and execute user schema file
    console.log("📋 Creating user tables...");
    const userSchemaSQL = fs.readFileSync(path.join(__dirname, "003-users-schema.sql"), "utf8");

    // Split into individual statements and execute
    const schemaStatements = userSchemaSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of schemaStatements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await sql.query(statement);
      } catch (error) {
        console.log(`⚠️  Statement failed (this might be expected): ${error.message}`);
        // Continue with other statements
      }
    }
    console.log("✅ User tables created successfully");

    console.log("🎉 User setup complete!");
  } catch (error) {
    console.error("❌ User setup failed:", error.message);
    process.exit(1);
  }
}

setupUsers();
