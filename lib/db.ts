import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  throw new Error("DATABASE_URL environment variable is not set");
}

const pgPool = new Pool({
  connectionString: DATABASE_URL,
});

pgPool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

console.log('Database pool initialized with pg.');

/**
 * Executes a SQL query using a tagged template literal.
 * Example: await executeSqlTemplate`SELECT * FROM "User" WHERE id = ${userId}`;
 * IMPORTANT: Ensure that values are properly sanitized if they construct SQL parts,
 * though parameterized queries ($1, $2) handle value sanitization.
 */
export async function executeSqlTemplate(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
  const text = strings.reduce((prev, curr, i) => prev + curr + (values[i] !== undefined ? `$${i + 1}` : ""), "");
  
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_SQL === 'true') {
    console.log('[SQL_TEMPLATE_EXEC]', text, values);
  }

  try {
    const res = await pgPool.query(text, values);
    return res.rows;
  } catch (error) {
    console.error("Error executing SQL template:", error);
    console.error("Query:", text);
    console.error("Values:", values);
    throw error;
  }
}

/**
 * Executes a standard parameterized SQL query.
 * Example: await query('SELECT * FROM "User" WHERE id = $1', [userId]);
 */
export async function query(text: string, params?: any[]): Promise<any[]> {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_SQL === 'true') {
    console.log('[SQL_QUERY_EXEC]', text, params);
  }
  try {
    const res = await pgPool.query(text, params);
    return res.rows;
  } catch (error) {
    console.error("Error executing query:", error);
    console.error("Query:", text);
    console.error("Params:", params);
    throw error;
  }
}

// Export the pool if direct access is needed (e.g., for transactions)
export { pgPool };

// The old `pool.query` structure is replaced by the `query` function above.
// If any code was using `import { pool } from './db'` and `pool.query()`,
// it should be updated to use `import { query } from './db'` or `executeSqlTemplate`.
// For compatibility, we can provide a similar structure if absolutely needed,
// but it's better to refactor to the new functions.
export const pool = {
  query: async (text: string, params?: any[]) => {
    console.warn("Usage of `pool.query` is deprecated. Please use `query(text, params)` or `executeSqlTemplate` from `lib/db.ts` instead.");
    const result = await query(text, params);
    return { rows: result }; // pg returns { rows: ... }, so this matches
  }
};

// Only ONE export for sql!
export { executeSqlTemplate as sql }
