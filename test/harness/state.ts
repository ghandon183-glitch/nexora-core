/**
 * Mutable state shared between the tests and the runtime doubles in
 * ./stubs. Tests reset it per case so no state leaks between scenarios.
 */
export interface MailerCall {
  to: string;
  subject: string;
  html: string;
  messageId?: string;
}

export type TestEnv = Record<string, string | undefined>;

export const testState: {
  env: TestEnv;
  db: unknown;
  assets: unknown;
  mailerCalls: MailerCall[];
  mailerFailuresRemaining: number;
  mailerError: string;
} = {
  env: {},
  db: null,
  assets: null,
  mailerCalls: [],
  mailerFailuresRemaining: 0,
  mailerError: "smtp failure",
};

export function resetMailer(): void {
  testState.mailerCalls = [];
  testState.mailerFailuresRemaining = 0;
  testState.mailerError = "smtp failure";
}
