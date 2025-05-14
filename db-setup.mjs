import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import dotenv from 'dotenv';
import { axios} from 'axios'

dotenv.config();

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Setting up the database...');
  
  // Connection string
  const connectionString = process.env.DATABASE_URL;
  
  // Create a PostgreSQL client
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);
  
  try {
    console.log('Running migrations...');
    // This will automatically run needed migrations on the database
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Migrations completed successfully');
  } catch (error) {
    if (isAxiosError(error)){
      console.error('Error running migrations:', error.response.message);
      
    }else{
      console.error('Error running migrations:', error);
    }
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

main();