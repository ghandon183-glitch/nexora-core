import assert from "node:assert/strict";
import test from "node:test";

import { diagnoseMailFailure } from "../lib/mail-diagnostics";

test("classifies missing Gmail credentials without exposing details", () => {
  assert.equal(diagnoseMailFailure("Gmail not configured").code, "gmail_credentials_missing");
});

test("classifies Gmail authentication rejection", () => {
  const result = diagnoseMailFailure("Invalid login: 535-5.7.8 Username and Password not accepted");
  assert.equal(result.code, "gmail_auth_rejected");
  assert.match(result.message, /App Password/);
  assert.doesNotMatch(result.message, /535|secret|password=.+/i);
});

test("classifies SMTP connection errors", () => {
  assert.equal(diagnoseMailFailure("ETIMEDOUT").code, "smtp_connection_failed");
});

test("classifies message rejection", () => {
  assert.equal(diagnoseMailFailure("550 5.7.1 message rejected").code, "smtp_message_rejected");
});

test("unknown errors receive a generic diagnostic", () => {
  const result = diagnoseMailFailure("sensitive provider response detail");
  assert.equal(result.code, "smtp_send_failed");
  assert.doesNotMatch(result.message, /sensitive provider response detail/);
});
