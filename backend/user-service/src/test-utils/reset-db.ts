import pg from "pg";
import path from "path";
require("dotenv").config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: true,
});
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
});
export async function resetPublicSchema() {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const { rows } = await c.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname='public' AND tablename NOT IN ('schema_migrations')
    `);
    if (rows.length) {
      const list = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
      await c.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
    }
    await c.query("COMMIT");
  } finally {
    c.release();
  }
}
