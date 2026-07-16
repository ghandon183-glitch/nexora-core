import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

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
  const t = useTranslations("Footer");

  const productLinks = [
    { label: t("templates"), href: "/templates" },
    { label: t("components"), href: "/components" },
    { label: t("pricing"), href: "/pricing" },
    { label: t("dashboard"), href: "/dashboard" },
  ];

  const resourceLinks: { label: string; href?: string; disabled?: boolean }[] = [
    { label: t("documentation"), href: "/docs" },
    { label: t("guides"), disabled: true },
    { label: t("blog"), disabled: true },
    { label: t("support"), href: "/contact" },
  ];

  const companyLinks = [
    { label: t("about"), href: "/about" },
    { label: t("contact"), href: "/contact" },
    { label: t("privacy"), href: "/privacy" },
    { label: t("terms"), href: "/terms" },
  ];

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
                  {t("tagline")}
                </p>
              </div>

            </div>

            <p className="mt-6 max-w-md leading-8 text-gray-400">
              {t("description")}
            </p>

          </div>

          <div>

            <h3 className="mb-5 font-semibold text-white">
              {t("product")}
            </h3>

            <ul className="space-y-3 text-gray-400">
              {productLinks.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </ul>

          </div>

          <div>

            <h3 className="mb-5 font-semibold text-white">
              {t("resources")}
            </h3>

            <ul className="space-y-3 text-gray-400">
              {resourceLinks.map((link) => (
                <FooterLink key={link.label} {...link} />
              ))}
            </ul>

          </div>

          <div>

            <h3 className="mb-5 font-semibold text-white">
              {t("company")}
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
            {t("copyright")}
          </p>

          <p>
            {t("builtWith")}
          </p>

        </div>

      </div>
    </footer>
  );
}
