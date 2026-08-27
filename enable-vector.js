const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });
const sql = postgres(process.env.DATABASE_URL);

sql`CREATE EXTENSION IF NOT EXISTS vector;`
  .then(() => { 
    console.log('Vector extension enabled'); 
    process.exit(0); 
  })
  .catch(e => { 
    console.error(e); 
    process.exit(1); 
  });
