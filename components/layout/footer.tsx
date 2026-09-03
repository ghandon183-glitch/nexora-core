import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LogoMark from "@/components/ui/logo-mark";

function FooterLink({ label, href, disabled }: { label: string; href?: string; disabled?: boolean }) {
  if (disabled || !href) return <li title="Coming soon" className="cursor-not-allowed text-[#6f614f]">{label}</li>;
  return <li><Link href={href} className="transition hover:text-[#e0b76e]">{label}</Link></li>;
}

export default function Footer() {
  const t = useTranslations("Footer");
  const productLinks = [
    { label: t("templates"), href: "/templates" }, { label: t("components"), href: "/components" },
    { label: t("pricing"), href: "/pricing" }, { label: t("dashboard"), href: "/dashboard" },
  ];
  const resourceLinks: { label: string; href?: string; disabled?: boolean }[] = [
    { label: t("documentation"), href: "/docs" }, { label: "FAQ", href: "/faq" },
    { label: t("guides"), disabled: true }, { label: t("blog"), disabled: true }, { label: t("support"), href: "/contact" },
  ];
  const companyLinks = [
    { label: t("about"), href: "/about" }, { label: t("contact"), href: "/contact" },
    { label: t("privacy"), href: "/privacy" }, { label: t("terms"), href: "/terms" },
  ];
  return (
    <footer className="border-t border-[#d9b06c]/12 bg-[#0e0804]">
      <div className="mx-auto max-w-7xl px-8 py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#e0b76e] to-[#8c5f2d] p-2.5 text-[#160c03]"><LogoMark className="h-full w-full" /></div>
              <div><h2 className="text-2xl font-bold text-[#f6efe1]">Nexora</h2><p className="text-sm text-[#8f8068]">{t("tagline")}</p></div>
            </div>
            <p className="mt-6 max-w-md leading-8 text-[#b6a888]">{t("description")}</p>
          </div>
          {[ [t("product"), productLinks], [t("resources"), resourceLinks], [t("company"), companyLinks] ].map(([title, links]) => (
            <div key={title as string}><h3 className="mb-5 font-semibold text-[#f6efe1]">{title as string}</h3><ul className="space-y-3 text-[#a99a81]">{(links as {label:string;href?:string;disabled?:boolean}[]).map(link => <FooterLink key={link.label} {...link}/>)}</ul></div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#d9b06c]/12 pt-8 text-sm text-[#756750] md:flex-row"><p>{t("copyright")}</p><p>{t("builtWith")}</p></div>
      </div>
    </footer>
  );
}
