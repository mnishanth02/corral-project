import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL = import.meta.env?.VITE_API_URL ?? "http://localhost:3000";

type AuthClientError = {
  code?: string;
  message?: string;
};

type AuthResult<TData> = Promise<{
  data: TData | null;
  error: AuthClientError | null;
}>;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified?: boolean;
  role?: string | string[] | null;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AuthSession = {
  user: AuthUser;
  session: {
    id: string;
    userId: string;
    token?: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  };
};

export type AuthClient = {
  getSession: () => AuthResult<AuthSession>;
  signIn: {
    email: (input: {
      email: string;
      password: string;
      callbackURL?: string;
    }) => AuthResult<unknown>;
    social: (input: { provider: "google"; callbackURL?: string }) => AuthResult<unknown>;
  };
  signOut: () => AuthResult<unknown>;
  admin: {
    listUsers: (input: {
      query: {
        limit: number;
        offset: number;
        sortBy?: string;
        sortDirection?: "asc" | "desc";
      };
    }) => AuthResult<{ users: AuthUser[]; total: number }>;
    createUser: (input: {
      email: string;
      name: string;
      password: string;
      role: "user";
    }) => AuthResult<{ user: AuthUser }>;
  };
};

export const authClient = createAuthClient({
  baseURL,
  plugins: [adminClient()],
}) as unknown as AuthClient;

export function isAdminUser(user: Pick<AuthUser, "role"> | null | undefined) {
  const role = user?.role;

  if (Array.isArray(role)) {
    return role.includes("admin");
  }

  return role === "admin";
}

export function getSafeRedirectPath(value: unknown) {
  if (typeof value !== "string" || value.trim() === "" || value.startsWith("//")) {
    return "/";
  }

  if (value.startsWith("/")) {
    return value;
  }

  const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;

  try {
    const url = new URL(value, origin);

    if (url.origin !== origin) {
      return "/";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
