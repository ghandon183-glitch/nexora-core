import { testState } from "../state.ts";

export async function getCloudflareContext() {
  return { env: { ORDERS_DB: testState.db, ASSETS: testState.assets } };
}
