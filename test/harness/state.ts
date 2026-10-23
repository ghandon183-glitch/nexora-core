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

export interface ResendCall {
  from?: string;
  to: string;
  subject: string;
  html: string;
}

export type TestEnv = Record<string, string | undefined>;

export interface ResendError {
  name: string;
  statusCode: number | null;
}

export const testState: {
  env: TestEnv;
  db: unknown;
  assets: unknown;
  mailerCalls: MailerCall[];
  resendCalls: ResendCall[];
  mailerFailuresRemaining: number;
  mailerError: string;
  /** When set, the Resend double resolves an error object instead of throwing. */
  resendError: ResendError | null;
  /** Signed admin session returned by the `next/headers` double. */
  adminSession: string | null;
} = {
  env: {},
  db: null,
  assets: null,
  mailerCalls: [],
  resendCalls: [],
  mailerFailuresRemaining: 0,
  mailerError: "smtp failure",
  resendError: null,
  adminSession: null,
};

export function resetMailer(): void {
  testState.mailerCalls = [];
  testState.resendCalls = [];
  testState.mailerFailuresRemaining = 0;
  testState.mailerError = "smtp failure";
  testState.resendError = null;
  testState.adminSession = null;
}
