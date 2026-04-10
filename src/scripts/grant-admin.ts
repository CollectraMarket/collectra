import { sql } from "drizzle-orm";
import { db } from "@/db/client";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error("Usage: npm run role:grant-admin -- someone@example.com");
  }

  const result = await db.execute(sql`
    update profiles as p
    set role = 'admin'
    from auth.users as u
    where p.user_id = u.id
      and lower(u.email) = ${email}
    returning p.id, p.username, p.display_name, p.role
  `);

  const rows = (result as { rows?: unknown[] }).rows ?? [];

  if (!rows.length) {
    throw new Error(
      `No profile found for ${email}. The user must confirm auth and create a profile first.`
    );
  }

  console.log(`Admin role granted to ${email}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
