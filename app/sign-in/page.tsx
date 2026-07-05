"use client";

import { useState, FormEvent } from "react";

import AuthCard from "@/components/auth/auth-card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function SignInPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email || !password) {
      setError("Please fill in both fields.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setSubmitted(true);
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to access your templates and orders."
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/sign-up"
    >
      {submitted ? (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-300">
          This is a UI preview — there is no backend connected yet, so
          accounts aren&apos;t saved. Once a database is added, this form
          will sign you in for real.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            Sign In
          </Button>
        </form>
      )}
    </AuthCard>
  );
}