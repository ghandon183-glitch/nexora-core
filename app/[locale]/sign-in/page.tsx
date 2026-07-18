"use client";

import { useState, FormEvent, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";

import AuthCard from "@/components/auth/auth-card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";

function SignInForm() {
  const t = useTranslations("SignIn");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const { signIn } = useAuth();

  const router = useRouter();

  const searchParams = useSearchParams();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email || !password) {
      setError(t("errorFillBoth"));
      return;
    }

    if (!email.includes("@")) {
      setError(t("errorInvalidEmail"));
      return;
    }

    setError("");

    const name = email.split("@")[0];

    signIn({ name, email });

    const next = searchParams.get("next") || "/dashboard";
    router.push(next);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label htmlFor="signin-email" className="mb-2 block text-sm text-slate-300">
          {t("emailLabel")}
        </label>

        <Input
          id="signin-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="signin-password" className="mb-2 block text-sm text-slate-300">
          {t("passwordLabel")}
        </label>

        <Input
          id="signin-password"
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
        {t("noBackendNote")}
      </p>

      <Button
        type="submit"
        className="w-full"
      >
        {t("submit")}
      </Button>
    </form>
  );
}

export default function SignInPage() {
  const t = useTranslations("SignIn");
  return (
    <AuthCard
      title={t("title")}
      subtitle={t("subtitle")}
      footerText={t("footerText")}
      footerLinkText={t("footerLinkText")}
      footerLinkHref="/sign-up"
    >
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </AuthCard>
  );
}
