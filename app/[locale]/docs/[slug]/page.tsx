import { notFound } from "next/navigation";
import { getTemplate, getAllTemplates } from "@/lib/data/get-template";
import { getTemplateGuide } from "@/lib/data/template-guides";
import Navbar from "@/components/navigation/navbar";
import ProductGuide from "@/components/product/product-guide";
import Container from "@/components/ui/container";
import Card from "@/components/ui/card";
export function generateStaticParams(){return getAllTemplates().map(template=>({slug:template.slug}));}
export default async function TemplateDocsPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const template=getTemplate(slug); const guide=getTemplateGuide(slug); if(!template||!guide) notFound();
  return <><Navbar/><main className="min-h-screen bg-[#060B18] pt-36 pb-24"><Container><div className="mx-auto max-w-5xl">
    <div className="mb-12"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Template documentation</p><h1 className="mt-4 text-5xl font-black tracking-tight text-white">{template.title}</h1><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">{template.description}</p><div className="mt-6 flex flex-wrap gap-3 text-xs text-slate-400"><span className="rounded-full border border-white/10 px-3 py-1">{template.framework}</span><span className="rounded-full border border-white/10 px-3 py-1">{template.styling}</span><span className="rounded-full border border-white/10 px-3 py-1">Version {template.version}</span></div></div>
    <ProductGuide guide={guide}/><Card className="mt-10 p-7"><h2 className="text-lg font-bold text-white">Before you publish</h2><p className="mt-2 text-sm leading-6 text-slate-400">Replace demo content, verify third-party asset licenses, connect production services, test the complete user journey, and run a production build. The template is a professional starting point—not a substitute for your product&apos;s own content, backend, legal pages, or service configuration.</p></Card>
  </div></Container></main></>;
}
