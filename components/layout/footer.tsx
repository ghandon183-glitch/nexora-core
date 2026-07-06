import Link from "next/link";

const productLinks = [
  { label: "Templates", href: "/templates" },
  { label: "Components", href: "/components" },
  { label: "Pricing", href: "/pricing" },
  { label: "Dashboard", href: "/dashboard" },
];

const resourceLinks: { label: string; href?: string; disabled?: boolean }[] = [
  { label: "Documentation", href: "/docs" },
  { label: "Guides", disabled: true },
  { label: "Blog", disabled: true },
  { label: "Support", href: "/contact" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

function FooterLink({
  label,
  href,
  disabled,
}: {
  label: string;
  href?: string;
  disabled?: boolean;
}) {
  if (disabled || !href) {
    return (
      <li
        title="Coming soon"
        className="cursor-not-allowed text-slate-600"
      >
        {label}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className="transition hover:text-cyan-400"
      >
        {label}
      </Link>
    </li>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#040812]">
      <div className="mx-auto max-w-7xl px-8 py-20">

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">

          <div className="lg:col-span-2">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 text-xl font-black text-black">
                N
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  Nexora
                </h2>

                <p className="text-sm text-gray-500">
                  Premium UI Kit
                </p>
              </div>

            </div>

            <p className="mt-6 max-w-md leading-8 text-gray-400">
              Premium Next.js templates and reusable UI components
              crafted for startups, SaaS businesses and modern web
              applications.
            </p>

          </div>

          <div>

            <h3 className="mb-5 font-semibold text-white">
              Product
            </h3>

            <ul className="space-y-3 text-gray-400">
              {productLinks.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </ul>

          </div>

          <div>

            <h3 className="mb-5 font-semibold text-white">
              Resources
            </h3>

            <ul className="space-y-3 text-gray-400">
              {resourceLinks.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </ul>

          </div>

          <div>

            <h3 className="mb-5 font-semibold text-white">
              Company
            </h3>

            <ul className="space-y-3 text-gray-400">
              {companyLinks.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </ul>

          </div>

        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-gray-500 md:flex-row">

          <p>
            © 2026 Nexora. All rights reserved.
          </p>

          <p>
            Designed with ❤️ using Next.js & Tailwind CSS
          </p>

        </div>

      </div>
    </footer>
  );
}
