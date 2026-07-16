"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";

import AuthCard from "@/components/auth/auth-card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";

export default function SignUpPage() {
  const [name, setName] = useState("");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const { signIn } = useAuth();

  const router = useRouter();

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

    signIn({ name, email });
    router.push("/dashboard");
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Get access to premium templates and future updates."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/sign-in"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label htmlFor="signup-name" className="mb-2 block text-sm text-slate-300">
            Full name
          </label>

          <Input
            id="signup-name"
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-2 block text-sm text-slate-300">
            Email
          </label>

          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="mb-2 block text-sm text-slate-300">
            Password
          </label>

          <Input
            id="signup-password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="mb-2 block text-sm text-slate-300">
            Confirm password
          </label>

          <Input
            id="signup-confirm-password"
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

        <p className="text-xs text-slate-500">
          There is no backend connected yet, so this creates a local
          session on this device only.
        </p>

        <Button
          type="submit"
          className="w-full"
        >
          Create Account
        </Button>
      </form>
    </AuthCard>
  );
}