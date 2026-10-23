import { testState } from "../state.ts";

// Records Resend sends instead of contacting the provider. When
// `testState.resendError` is set the call resolves with a provider error
// object (the SDK's non-throwing failure shape) instead of a message id.
export class Resend {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  emails = {
    send: async (message) => {
      testState.resendCalls.push({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
      });

      if (testState.resendError) {
        return { data: null, error: testState.resendError, headers: null };
      }

      return { data: { id: "resend_test_message" }, error: null, headers: null };
    },
  };
}
