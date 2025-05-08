import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

async function main() {
  console.log("Checking database connection...");

  try {
    // Get the DATABASE_URL from environment variables
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create a Postgres client
    const client = postgres(connectionString);
    
    // Create Drizzle instance
    const db = drizzle(client);
    
    // Try to query the database
    console.log("Executing test query...");
    const result = await client`SELECT current_database() as database_name, current_schema() as schema_name`;
    
    console.log("Connection successful!");
    console.log(`Database: ${result[0].database_name}`);
    console.log(`Schema: ${result[0].schema_name}`);
    
    // Try to query a list of tables
    console.log("\nListing tables in the database:");
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    if (tables.length === 0) {
      console.log("No tables found in the public schema.");
    } else {
      console.log("Tables in the database:");
      tables.forEach((table, i) => {
        console.log(`${i+1}. ${table.table_name}`);
      });
    }

    // Close the client
    await client.end();
    console.log("\nDatabase connection closed");
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
}

main();