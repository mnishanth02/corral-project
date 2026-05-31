import { z } from "zod";

/**
 * Parse and validate environment variables against a Zod schema.
 * Throws a readable error (and exits in non-test runtimes) when validation fails
 * so misconfiguration is caught at boot rather than at first use.
 */
export function parseEnv<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  env: NodeJS.ProcessEnv = process.env,
): z.infer<TSchema> {
  const result = schema.safeParse(env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }

  return result.data;
}

export { z };
