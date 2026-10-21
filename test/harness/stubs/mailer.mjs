import { testState } from "../state.ts";

// Never sends email. Records the call and can fail a fixed number of times so
// outbox retry/backoff behaviour can be exercised deterministically.
export async function sendCustomerEmail(params) {
  testState.mailerCalls.push({
    to: params.to,
    subject: params.subject,
    html: params.html,
    messageId: params.messageId,
  });

  if (testState.mailerFailuresRemaining > 0) {
    testState.mailerFailuresRemaining -= 1;
    return { sent: false, error: testState.mailerError };
  }

  return { sent: true };
}
