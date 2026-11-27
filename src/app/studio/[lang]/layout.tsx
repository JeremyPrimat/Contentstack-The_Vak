import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { RootHtml } from "@/components/RootHtml";
import { isLang } from "@/lib/i18n";

export default async function StudioLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <RootHtml lang={lang}>{children}</RootHtml>;
}
