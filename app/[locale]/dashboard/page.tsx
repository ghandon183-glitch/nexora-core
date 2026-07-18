"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";

import { useAuth } from "@/lib/context/auth-context";
import { usePurchases } from "@/lib/context/purchases-context";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Navbar from "@/components/navigation/navbar";

// Templates with a real, downloadable source-code package. Templates not
// listed here don't have a build yet — customers still see their purchase,
// but get a "coming soon" note instead of a broken download link.
const DOWNLOADS: Record<string, string> = {
  "modern-saas": "/downloads/modern-saas.zip",
  "admin-dashboard": "/downloads/admin-dashboard.zip",
  "creative-agency": "/downloads/creative-agency.zip",
  "kiln-estates": "/downloads/kiln-estates.zip",
  "nexi-ai": "/downloads/nexi-ai.zip",
};

export default function DashboardPage() {
  const t = useTranslations("DashboardPage");
  const { user, loading, signOut } = useAuth();

  const { purchases } = usePurchases();

  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#060B18]">
        <p className="text-slate-500">
          {t("loading")}
        </p>
      </main>
    );
  }

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  const totalSpent = purchases.reduce(
    (sum, purchase) => sum + purchase.price,
    0
  );

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#060B18] px-6 pt-36 pb-20">

      <div className="mx-auto max-w-5xl">

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-3xl font-black text-white">
              {t("welcomeBack")}, {user.name}
            </h1>

            <p className="mt-2 text-slate-400">
              {user.email}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleSignOut}
          >
            {t("signOut")}
          </Button>

        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">

          <Card className="p-6 hover:-translate-y-0 hover:border-white/10">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {t("templatesOwned")}
            </p>

            <p className="mt-3 text-3xl font-black text-white">
              {purchases.length}
            </p>
          </Card>

          <Card className="p-6 hover:-translate-y-0 hover:border-white/10">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {t("totalSpent")}
            </p>

            <p className="mt-3 text-3xl font-black text-white">
              ${totalSpent}
            </p>
          </Card>

          <Card className="p-6 hover:-translate-y-0 hover:border-white/10">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {t("memberSince")}
            </p>

            <p className="mt-3 text-3xl font-black text-white">
              {t("today")}
            </p>
          </Card>

        </div>

        <div className="mt-12">

          <h2 className="text-xl font-bold text-white">
            {t("myPurchases")}
          </h2>

          {purchases.length === 0 ? (
            <Card className="mt-6 flex flex-col items-center justify-center gap-4 p-16 text-center hover:-translate-y-0 hover:border-white/10">

              <p className="text-slate-400">
                {t("noPurchasesText")}
              </p>

              <Button
                onClick={() => router.push("/templates")}
              >
                {t("browseTemplates")}
              </Button>

            </Card>
          ) : (
            <div className="mt-6 space-y-4">

              {purchases.map((purchase) => {
                const downloadUrl = DOWNLOADS[purchase.slug];

                return (
                  <Card
                    key={purchase.slug}
                    className="flex flex-col gap-4 p-6 hover:-translate-y-0 hover:border-white/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {purchase.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {t("purchasedOn")}{" "}
                        {new Date(purchase.purchasedAt).toLocaleDateString()}
                      </p>

                      {!downloadUrl && (
                        <p className="mt-1 text-xs text-amber-400">
                          {t("sourcePending")}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-3">
                      <Link href={`/templates/${purchase.slug}`}>
                        <Button variant="outline">
                          {t("viewTemplate")}
                        </Button>
                      </Link>

                      {downloadUrl && (
                        <a href={downloadUrl} download>
                          <Button>
                            {t("downloadSource")}
                          </Button>
                        </a>
                      )}
                    </div>
                  </Card>
                );
              })}

            </div>
          )}

        </div>

      </div>

      </main>
    </>
  );
}
