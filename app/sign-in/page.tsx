"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

import AuthCard from "@/components/auth/auth-card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";

export default function SignInPage() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const { signIn } = useAuth();

  const router = useRouter();

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

    const name = email.split("@")[0];

    signIn({ name, email });
    router.push("/dashboard");
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to access your templates and orders."
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerLinkHref="/sign-up"
    >
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

        <p className="text-xs text-slate-500">
          There is no backend connected yet, so this signs you in
          locally on this device only.
        </p>

        <Button
          type="submit"
          className="w-full"
        >
          Sign In
        </Button>
      </form>
    </AuthCard>
  );
}