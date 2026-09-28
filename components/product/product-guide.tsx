import Link from "next/link";
import type { TemplateGuide } from "@/lib/data/template-guides";
import Card from "@/components/ui/card";
export default function ProductGuide({ guide }: { guide: TemplateGuide }) {
  return <section className="space-y-8">
    <Card className="rounded-3xl border border-cyan-400/15 bg-cyan-400/[0.03] p-8"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">What you are buying</p><p className="mt-4 max-w-4xl text-xl leading-8 text-white">{guide.positioning}</p><div className="mt-6 flex flex-wrap gap-2">{guide.idealFor.map((item)=><span key={item} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{item}</span>)}</div></Card>
    <div className="grid gap-6 lg:grid-cols-2">{[["Included in the package",guide.included],["Requirements",guide.requirements],["Installation",guide.setup],["Customization checklist",guide.customization],["Deployment checklist",guide.deployment]].map(([title,items])=><Card key={title as string} className="p-7 hover:-translate-y-0 hover:border-white/10"><h2 className="text-lg font-bold text-white">{title as string}</h2><ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">{(items as string[]).map(item=><li key={item} className="flex gap-3"><span className="text-cyan-400">✓</span><span>{item}</span></li>)}</ul></Card>)}</div>
    <Card className="p-7"><h2 className="text-lg font-bold text-white">Typical installation time</h2><p className="mt-2 text-slate-400">{guide.installTime}</p><p className="mt-5 text-sm leading-6 text-slate-500">Need help after purchase? See the <Link href="/support" className="text-cyan-300 hover:underline">support policy</Link> and <Link href="/license" className="text-cyan-300 hover:underline">license</Link>.</p></Card>
    <div><h2 className="text-2xl font-bold text-white">Product FAQ</h2><div className="mt-5 space-y-4">{guide.faq.map(item=><Card key={item.question} className="p-6 hover:-translate-y-0 hover:border-white/10"><h3 className="font-semibold text-white">{item.question}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{item.answer}</p></Card>)}</div></div>
  </section>;
}
