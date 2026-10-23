import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const url = process.env.DATABASE_URL || 'postgres://pb:pb@localhost:5432/portfolio_builder';

export const pool = new pg.Pool({ connectionString: url });
export const db = drizzle(pool, { schema });
export { schema };
