"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/context/auth-context";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Navbar from "@/components/navigation/navbar";
import FloatingDock from "@/components/navigation/floating-dock";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();

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
          Loading...
        </p>
      </main>
    );
  }

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  return (
    <>
      <Navbar />
      <FloatingDock />

      <main className="min-h-screen bg-[#060B18] px-6 pt-36 pb-20">

      <div className="mx-auto max-w-5xl">

        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

          <div>
            <h1 className="text-3xl font-black text-white">
              Welcome back, {user.name}
            </h1>

            <p className="mt-2 text-slate-400">
              {user.email}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>

        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">

          <Card className="p-6 hover:-translate-y-0 hover:border-white/10">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Templates Owned
            </p>

            <p className="mt-3 text-3xl font-black text-white">
              0
            </p>
          </Card>

          <Card className="p-6 hover:-translate-y-0 hover:border-white/10">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Total Spent
            </p>

            <p className="mt-3 text-3xl font-black text-white">
              $0
            </p>
          </Card>

          <Card className="p-6 hover:-translate-y-0 hover:border-white/10">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Member Since
            </p>

            <p className="mt-3 text-3xl font-black text-white">
              Today
            </p>
          </Card>

        </div>

        <div className="mt-12">

          <h2 className="text-xl font-bold text-white">
            My Purchases
          </h2>

          <Card className="mt-6 flex flex-col items-center justify-center gap-4 p-16 text-center hover:-translate-y-0 hover:border-white/10">

            <p className="text-slate-400">
              You haven&apos;t purchased any templates yet.
            </p>

            <Button
              onClick={() => router.push("/templates")}
            >
              Browse Templates
            </Button>

          </Card>

        </div>

      </div>

      </main>
    </>
  );
}
