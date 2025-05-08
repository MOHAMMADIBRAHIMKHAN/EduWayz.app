// Simple script to check database connection
import postgres from 'postgres';

async function main() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('Connecting to PostgreSQL database...');
    const sql = postgres(process.env.DATABASE_URL);
    
    // Check the connection by running a simple query
    const result = await sql`SELECT NOW()`;
    console.log('Connected to database successfully!');
    console.log('Current timestamp:', result[0].now);
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('\nExisting tables:');
    if (tables.length === 0) {
      console.log('No tables found in the database.');
    } else {
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
    
    await sql.end();
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

main();