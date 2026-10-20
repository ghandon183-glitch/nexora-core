import { testState } from "../state.ts";

// Mirrors lib/env.ts but reads the per-test environment instead of the
// Cloudflare request context and process.env.
export async function getEnv() {
  return { ...testState.env };
}
