import Image from "next/image";
import Link from "next/link";

import Card from "./card";
import Button from "./button";
import { getHeadingFontClass } from "@/lib/fonts";

interface TemplateCardProps {
  slug: string;
  title: string;
  description: string;
  image: string;
  price: number;
  badge?: string;
  demoUrl?: string;
  components?: number;
}

export default function TemplateCard({
  slug,
  title,
  description,
  image,
  price,
  badge,
  demoUrl,
  components,
}: TemplateCardProps) {
  const hasDemo = demoUrl && demoUrl !== "#";
  return (
    <Card className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 p-0 transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/40 hover:shadow-[0_25px_60px_rgba(6,182,212,.18)]">

      <Link href={`/templates/${slug}`}>

        <div className="relative aspect-[16/10] overflow-hidden">

          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width:768px) 100vw,(max-width:1200px) 50vw,33vw"
            className="object-cover transition duration-700 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent opacity-90" />

          {badge && (
            <div className="absolute right-5 top-5 rounded-full border border-cyan-400/30 bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-xl">
              {badge}
            </div>
          )}

          <div className="absolute bottom-5 left-5">

            <div className="rounded-full bg-black/40 px-4 py-2 backdrop-blur-xl">

              <span className="text-2xl font-black text-cyan-400">
                ${price}
              </span>

            </div>

          </div>

        </div>

      </Link>

      <div className="space-y-5 p-6">

        <div>

          <h3 className={`text-2xl font-bold text-white transition-colors duration-300 group-hover:text-cyan-400 ${getHeadingFontClass(slug)}`}>
            {title}
          </h3>

          <p className="mt-3 leading-7 text-slate-400">
            {description}
          </p>

        </div>

        <div className="grid grid-cols-3 gap-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-center">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Framework
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              Next.js
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-center">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Styling
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              Tailwind
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 text-center">

            <p className="text-xs uppercase tracking-wider text-slate-500">
              Components
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {components ?? "—"}+
            </p>

          </div>

        </div>

        <div className="flex gap-3">

          <Link
            href={`/templates/${slug}`}
            className="flex-1"
          >
            <Button className="w-full">
              View Template
            </Button>
          </Link>

          {hasDemo ? (
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button variant="outline" className="w-full">
                Live Preview
              </Button>
            </a>
          ) : (
            <Button
              variant="outline"
              className="flex-1 cursor-not-allowed opacity-50"
              disabled
              title="Live preview coming soon"
            >
              Coming Soon
            </Button>
          )}

        </div>

      </div>

    </Card>
  );
}