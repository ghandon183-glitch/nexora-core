import { Link } from "@/i18n/navigation";
import Navbar from "@/components/navigation/navbar";
import Container from "@/components/ui/container";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { getAllTemplates } from "@/lib/data/get-template";
export default function BundlePage(){
  const templates=getAllTemplates(); const retail=templates.reduce((sum,item)=>sum+item.price,0);
  return <><Navbar/><main className="min-h-screen bg-[#060B18] pt-36 pb-24"><Container><div className="mx-auto max-w-6xl">
    <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Complete collection</p><h1 className="mt-4 text-5xl font-black tracking-tight text-white">All 12 Nexora Core Templates</h1><p className="mt-5 text-lg leading-8 text-slate-400">One purchase unlocks the complete current collection: SaaS, dashboards, agencies, commerce, wellness, editorial, hospitality, creative studios, AI products, and more.</p></div>
    <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]"><Card className="p-8"><h2 className="text-xl font-bold text-white">The collection</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">{templates.map(template=><Link key={template.slug} href={"/templates/"+template.slug} className="rounded-2xl border border-white/10 p-4 transition hover:border-cyan-400/30"><div className="flex items-center justify-between gap-4"><span className="font-semibold text-white">{template.title}</span><span className="text-sm text-slate-500">{"$"+template.price}</span></div><p className="mt-1 text-xs text-slate-500">{template.category}</p></Link>)}</div></Card>
      <Card className="h-fit p-8 lg:sticky lg:top-32"><p className="text-xs uppercase tracking-[0.25em] text-slate-500">Bundle price</p><p className="mt-3 text-5xl font-black text-cyan-400">$199</p><p className="mt-3 text-sm text-slate-400">Individual listed prices total {"$"+retail}. The bundle is a single purchase for the full collection.</p><div className="mt-6 space-y-3 text-sm text-slate-300"><p>✓ All 12 source packages</p><p>✓ Commercial single-end-product license per template</p><p>✓ Lifetime updates while maintained</p><p>✓ Unified documentation and support</p></div><Link href="/checkout/all-templates" className="mt-7 block"><Button className="w-full">Get the complete collection</Button></Link></Card></div>
  </div></Container></main></>;
}
