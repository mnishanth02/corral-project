// Side-effect import: loads the root `.env` (via env.ts dotenv config) BEFORE
// `@corral/db` initializes its connection from `process.env.DATABASE_URL`.
// Biome does not reorder side-effect imports, so this stays first.
import "../env";
import { queryClient } from "@corral/db";
import { getEnv } from "../env";
import { auth } from "./auth";

async function main(): Promise<void> {
  const env = getEnv();
  const email = env.AUTH_BOOTSTRAP_ADMIN_EMAIL?.toLowerCase();
  const password = env.AUTH_BOOTSTRAP_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("AUTH_BOOTSTRAP_ADMIN_EMAIL and AUTH_BOOTSTRAP_ADMIN_PASSWORD are required");
  }

  const user = await ensureAdminUser({
    email,
    password,
    name: env.AUTH_BOOTSTRAP_ADMIN_NAME ?? "Corral Admin",
  });

  if (env.AUTH_SEED_DEMO_DATA) {
    await ensureDemoDomain(user.id, user.email);
  }
}

async function ensureAdminUser(input: { email: string; password: string; name: string }) {
  try {
    const result = await auth.api.createUser({
      body: {
        email: input.email,
        password: input.password,
        name: input.name,
        role: "admin",
        data: { emailVerified: true },
      },
    });

    await markEmailVerified(result.user.id);
    console.log(`Created admin user: ${result.user.email}`);
    return result.user;
  } catch (error) {
    if (isExistingUserError(error)) {
      console.log(`User already exists, leaving password and role unchanged: ${input.email}`);
      const existing = await queryClient<Array<{ id: string; email: string; name: string }>>`
        SELECT id, email, name
        FROM "user"
        WHERE email = ${input.email}
        LIMIT 1
      `;

      if (!existing[0]) {
        throw new Error(`Existing admin user could not be loaded: ${input.email}`);
      }

      await markEmailVerified(existing[0].id);
      return existing[0];
    }

    throw error;
  }
}

async function markEmailVerified(userId: string): Promise<void> {
  await queryClient`
    UPDATE "user"
    SET email_verified = true, updated_at = NOW()
    WHERE id = ${userId} AND email_verified = false
  `;
}

function isExistingUserError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const { body, message } = error as { body?: { code?: string }; message?: string };

  return (
    body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
    message === "User already exists. Use another email."
  );
}

async function ensureDemoDomain(adminUserId: string, adminEmail: string): Promise<void> {
  await queryClient`
    INSERT INTO organizer (
      id, slug, name, legal_name, owner_email, phone, city, state, gstin,
      review_status, entity_type, payment_account_status, support_contact, created_by_user_id
    )
    VALUES (
      'org-kovai-road-runners', 'kovai-road-runners', 'Kovai Road Runners',
      'Kovai Road Runners Sports Trust', 'priya@kovairoadclub.in', '+91 98765 10420',
      'Coimbatore', 'Tamil Nadu', '33AAECK1042R1Z5', 'approved', 'gst', 'verified',
      'support@kovairoadclub.in', ${adminUserId}
    )
    ON CONFLICT (id) DO NOTHING
  `;

  await queryClient`
    INSERT INTO organizer_member (id, organizer_id, user_id, role, status, invited_email)
    VALUES (${`om-${adminUserId}-kovai`}, 'org-kovai-road-runners', ${adminUserId}, 'Owner', 'active', ${adminEmail})
    ON CONFLICT (organizer_id, user_id) DO NOTHING
  `;

  await queryClient`
    INSERT INTO event (
      id, organizer_id, slug, name, status, date, starts_at, venue_name, venue_address,
      city, timezone, registration_opens_at, registration_closes_at
    )
    VALUES
      (
        'coimbatore-marathon-2026', 'org-kovai-road-runners', 'coimbatore-marathon-2026',
        'Coimbatore Marathon 2026', 'published', '2026-07-12', '2026-07-12T05:30:00+05:30',
        'CODISSIA Trade Fair Complex', 'Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu 641004',
        'Coimbatore', 'Asia/Kolkata', '2026-02-01T09:00:00+05:30', '2026-07-05T23:59:00+05:30'
      ),
      (
        'race-course-night-10k-2026', 'org-kovai-road-runners', 'race-course-night-10k-2026',
        'Race Course Night 10K', 'draft', '2026-10-03', '2026-10-03T19:00:00+05:30',
        'Race Course Road', 'Race Course Road, Gopalapuram, Coimbatore, Tamil Nadu 641018',
        'Coimbatore', 'Asia/Kolkata', '2026-06-01T09:00:00+05:30', '2026-09-27T23:59:00+05:30'
      )
    ON CONFLICT (id) DO NOTHING
  `;

  console.log("Ensured demo organizer, owner membership, and console events.");
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await queryClient.end();
  });
