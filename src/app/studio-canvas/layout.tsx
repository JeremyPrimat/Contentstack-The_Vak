import type { ReactNode } from "react";
import { RootHtml } from "@/components/RootHtml";

export default function CanvasLayout({ children }: { children: ReactNode }) {
  return <RootHtml lang="en">{children}</RootHtml>;
}
