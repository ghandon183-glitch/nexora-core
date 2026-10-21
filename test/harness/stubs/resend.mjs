import { testState } from "../state.ts";

// Records Resend sends instead of contacting the provider.
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
      return { data: { id: "resend_test_message" }, error: null };
    },
  };
}
