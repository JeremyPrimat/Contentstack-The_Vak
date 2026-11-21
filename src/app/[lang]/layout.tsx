import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { RootHtml } from "@/components/RootHtml";
import { isLang, LANGS } from "@/lib/i18n";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function LangLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <RootHtml lang={lang}>{children}</RootHtml>;
}
