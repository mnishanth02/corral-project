import { Logger } from "@nestjs/common";
import { getEnv } from "../env";

type AuthEmailKind = "verification" | "password-reset";

const logger = new Logger("AuthEmail");

export async function sendAuthEmailLink(
  kind: AuthEmailKind,
  input: { email: string; url: string },
) {
  const env = getEnv();

  if (env.AUTH_EMAIL_DELIVERY_MODE === "log") {
    logger.log(`${labelFor(kind)} requested for ${input.email}: ${input.url}`);
    return;
  }

  logger.warn(
    `${labelFor(kind)} email requested for ${input.email}, but email delivery is disabled.`,
  );
}

function labelFor(kind: AuthEmailKind) {
  return kind === "verification" ? "Email verification" : "Password reset";
}
