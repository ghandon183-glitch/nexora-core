import { notFound } from "next/navigation";
import { getOrderByToken } from "@/lib/orders/db";
import { getAllTemplates } from "@/lib/data/get-template";
import Navbar from "@/components/navigation/navbar";
import Container from "@/components/ui/container";
import Card from "@/components/ui/card";

export default async function BundleDownloadPage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const order=await getOrderByToken(token);
  if(!order||order.status!=="confirmed"||order.template_slug!=="all-templates") notFound();
  const templates=getAllTemplates();
  return <><Navbar/><main className="min-h-screen bg-[#060B18] pt-36 pb-24"><Container><div className="mx-auto max-w-4xl"><p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Purchase unlocked</p><h1 className="mt-4 text-5xl font-black text-white">Your complete Nexora Core collection</h1><p className="mt-4 text-slate-400">Your bundle purchase is confirmed. Download each source package below. The same secure purchase token authorizes the downloads.</p><div className="mt-10 grid gap-4 sm:grid-cols-2">{templates.map(template=><Card key={template.slug} className="p-5"><div className="flex items-center justify-between gap-4"><div><p className="font-bold text-white">{template.title}</p><p className="mt-1 text-xs text-slate-500">{template.framework} · v{template.version}</p></div><a href={"/api/download/"+token+"?slug="+encodeURIComponent(template.slug)} download className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">Download</a></div></Card>)}</div><p className="mt-8 text-center text-xs text-slate-600">Keep the license included with each package. Source redistribution is not permitted.</p></div></Container></main></>;
}
