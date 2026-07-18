"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

import AuthCard from "@/components/auth/auth-card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";

export default function SignUpPage() {
  const t = useTranslations("SignUp");
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
      setError(t("errorFillAll"));
      return;
    }

    if (!email.includes("@")) {
      setError(t("errorInvalidEmail"));
      return;
    }

    if (password.length < 8) {
      setError(t("errorPasswordLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("errorPasswordMismatch"));
      return;
    }

    setError("");

    signIn({ name, email });
    router.push("/dashboard");
  }

  return (
    <AuthCard
      title={t("title")}
      subtitle={t("subtitle")}
      footerText={t("footerText")}
      footerLinkText={t("footerLinkText")}
      footerLinkHref="/sign-in"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label htmlFor="signup-name" className="mb-2 block text-sm text-slate-300">
            {t("nameLabel")}
          </label>

          <Input
            id="signup-name"
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="signup-email" className="mb-2 block text-sm text-slate-300">
            {t("emailLabel")}
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
            {t("passwordLabel")}
          </label>

          <Input
            id="signup-password"
            type="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="signup-confirm-password" className="mb-2 block text-sm text-slate-300">
            {t("confirmPasswordLabel")}
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
          {t("noBackendNote")}
        </p>

        <Button
          type="submit"
          className="w-full"
        >
          {t("submit")}
        </Button>
      </form>
    </AuthCard>
  );
}
