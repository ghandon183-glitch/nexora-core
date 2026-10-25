import assert from "node:assert/strict";
import test from "node:test";

import { diagnoseMailFailure } from "../lib/mail-diagnostics";

test("classifies missing Gmail API OAuth credentials", () => {
  const result = diagnoseMailFailure("Gmail API OAuth credentials not configured");
  assert.equal(result.code, "gmail_oauth_credentials_missing");
  assert.match(result.message, /GMAIL_REFRESH_TOKEN/);
});

test("classifies rejected OAuth credentials without exposing secrets", () => {
  const result = diagnoseMailFailure("Gmail OAuth token request failed: invalid_grant");
  assert.equal(result.code, "gmail_oauth_rejected");
  assert.doesNotMatch(result.message, /invalid_grant|secret=.+|refresh_token/i);
});

test("classifies Gmail API send rejection", () => {
  assert.equal(
    diagnoseMailFailure("Gmail API send failed: PERMISSION_DENIED").code,
    "gmail_api_rejected",
  );
});

test("classifies legacy SMTP connection errors", () => {
  assert.equal(diagnoseMailFailure("ETIMEDOUT").code, "smtp_connection_failed");
});

test("unknown errors receive a generic diagnostic", () => {
  const result = diagnoseMailFailure("sensitive provider response detail");
  assert.equal(result.code, "gmail_api_send_failed");
  assert.doesNotMatch(result.message, /sensitive provider response detail/);
});
