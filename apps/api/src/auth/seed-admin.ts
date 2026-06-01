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

  try {
    const result = await auth.api.createUser({
      body: {
        email,
        password,
        name: env.AUTH_BOOTSTRAP_ADMIN_NAME ?? "Corral Admin",
        role: "admin",
      },
    });

    console.log(`Created admin user: ${result.user.email}`);
  } catch (error) {
    if (isExistingUserError(error)) {
      console.log(`User already exists, leaving password and role unchanged: ${email}`);
      return;
    }

    throw error;
  }
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

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await queryClient.end();
  });
