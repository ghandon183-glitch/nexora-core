import Link from "next/link";

import Card from "@/components/ui/card";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export default function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060B18] px-6 pt-36 pb-20">

      <div className="w-full max-w-md">

        <Link
          href="/"
          className="mb-10 flex items-center justify-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 font-black text-black">
            N
          </div>

          <span className="text-lg font-bold tracking-wide text-white">
            NEXORA
          </span>
        </Link>

        <Card className="p-10 hover:translate-y-0 hover:border-white/10">

          <h1 className="text-2xl font-black text-white">
            {title}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {subtitle}
          </p>

          <div className="mt-8">
            {children}
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            {footerText}{" "}
            <Link
              href={footerLinkHref}
              className="font-semibold text-cyan-400 hover:text-cyan-300"
            >
              {footerLinkText}
            </Link>
          </p>

        </Card>

      </div>

    </main>
  );
}