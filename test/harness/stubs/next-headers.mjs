import { testState } from "../state.ts";

export const ADMIN_COOKIE_NAME = "nexora_admin_session";

// Minimal `next/headers` double: the admin routes only read one cookie.
export async function cookies() {
  return {
    get(name) {
      if (name !== ADMIN_COOKIE_NAME || !testState.adminSession) return undefined;
      return { name, value: testState.adminSession };
    },
  };
}
