import { Link } from "@/i18n/navigation";
import Navbar from "@/components/navigation/navbar";
import Container from "@/components/ui/container";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { getAllTemplates } from "@/lib/data/get-template";
export default function ComparePage(){
 const templates=getAllTemplates();
 return <><Navbar/><main className="min-h-screen bg-[#060B18] pt-36 pb-24"><Container><div className="mx-auto max-w-7xl">
  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Choose by fit</p>
  <h1 className="mt-4 text-5xl font-black text-white">Compare the 12 templates</h1>
  <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">A factual side-by-side view of stack, category, component count, version, and current price. Use the individual product pages for the full feature and documentation breakdown.</p>
  <div className="mt-10 overflow-x-auto rounded-3xl border border-white/10"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-white/[0.03] text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-5 py-4">Template</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Framework</th><th className="px-5 py-4">Styling</th><th className="px-5 py-4">Components</th><th className="px-5 py-4">Version</th><th className="px-5 py-4">Price</th><th className="px-5 py-4"></th></tr></thead><tbody className="divide-y divide-white/10">{templates.map(t=><tr key={t.slug} className="text-slate-300"><td className="px-5 py-5 font-semibold text-white">{t.title}</td><td className="px-5 py-5">{t.category}</td><td className="px-5 py-5">{t.framework}</td><td className="px-5 py-5">{t.styling}</td><td className="px-5 py-5">{t.components}</td><td className="px-5 py-5">{t.version}</td><td className="px-5 py-5 font-bold text-cyan-300">{"$"+t.price}</td><td className="px-5 py-5"><Link href={"/templates/"+t.slug}><span className="text-cyan-300 hover:underline">Details</span></Link></td></tr>)}</tbody></table></div>
  <Card className="mt-10 flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold text-white">Want the complete collection?</h2><p className="mt-2 text-sm text-slate-400">See all twelve packages together on the bundle page.</p></div><Link href="/bundle"><Button>View all-template bundle</Button></Link></Card>
 </div></Container></main></>;
}
