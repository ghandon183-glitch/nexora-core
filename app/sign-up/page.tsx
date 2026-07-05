"use client";

import { useState, FormEvent } from "react";

import AuthCard from "@/components/auth/auth-card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function SignUpPage() {
  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in every field.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSubmitted(true);
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Get access to premium templates and future updates."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/sign-in"
    >
      {submitted ? (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-300">
          This is a UI preview — there is no backend connected yet, so
          accounts aren&apos;t saved. Once a database is added, this form
          will create a real account.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Full name
            </label>

            <Input
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Email
            </label>

            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Password
            </label>

            <Input
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Confirm password
            </label>

            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
          >
            Create Account
          </Button>
        </form>
      )}
    </AuthCard>
  );
}