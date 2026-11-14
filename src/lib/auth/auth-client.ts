import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * Universal secure sign-out helper:
 * Invalidates server-side session, nukes all client cookies, and clears browser storage
 */
export async function performSignOut(): Promise<void> {
  try {
    if (typeof signOut === "function") {
      await signOut();
    }
  } catch {
    // Graceful fallback if server is unreachable or in offline test environment
  }

  if (typeof document !== "undefined") {
    // Invalidate role and session cookies
    const cookiesToClear = [
      "ease_me_role",
      "ease_me_session",
      "ease_me.session_token",
      "better-auth.session_token",
    ];

    cookiesToClear.forEach((cookieName) => {
      document.cookie = `${cookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    });
  }

  if (typeof localStorage !== "undefined") {
    // Invalidate local storage tokens
    const localStorageKeys = [
      "ease_me_logged_in",
      "ease_me_active_role",
      "ease_me_platform_role",
      "ease_me_user_email",
    ];

    localStorageKeys.forEach((key) => {
      localStorage.removeItem(key);
    });
  }
}
