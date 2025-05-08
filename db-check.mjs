// Database connection check using pg client
import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000, // 5 second timeout
    query_timeout: 5000 // 5 second timeout for queries
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    
    console.log('Connected to database successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current timestamp:', result.rows[0].now);
    
    // Check if tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\nExisting tables:');
    if (tables.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      tables.rows.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }
  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await client.end();
  }
}

main();