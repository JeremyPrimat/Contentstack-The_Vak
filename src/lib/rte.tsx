import type { ReactNode } from "react";
import type { RteDoc, RteNode } from "./types";

/** Small JSON RTE renderer for the node types the model uses. Unknown nodes render their children. */
function renderNode(node: RteNode, key: string | number): ReactNode {
  if (node.text !== undefined) {
    let out: ReactNode = node.text;
    if (node.bold) out = <strong>{out}</strong>;
    if (node.italic) out = <em>{out}</em>;
    if (node.underline) out = <u>{out}</u>;
    return <span key={key}>{out}</span>;
  }
  const children = (node.children ?? []).map((c, i) => renderNode(c, c.uid ?? i));
  const k = node.uid ?? key;
  switch (node.type) {
    case "p":
      return <p key={k}>{children}</p>;
    case "h2":
      return <h2 key={k}>{children}</h2>;
    case "h3":
      return <h3 key={k}>{children}</h3>;
    case "h4":
      return <h4 key={k}>{children}</h4>;
    case "ul":
      return <ul key={k}>{children}</ul>;
    case "ol":
      return <ol key={k}>{children}</ol>;
    case "li":
      return <li key={k}>{children}</li>;
    case "blockquote":
      return <blockquote key={k}>{children}</blockquote>;
    case "a": {
      const href = String((node.attrs?.url as string) ?? (node.attrs?.href as string) ?? "#");
      return (
        <a key={k} href={href}>
          {children}
        </a>
      );
    }
    default:
      return <span key={k}>{children}</span>;
  }
}

export function Rte({ doc, className, cslp }: { doc?: RteDoc; className?: string; cslp?: Record<string, string> }) {
  if (!doc?.children?.length) return null;
  return (
    <div className={["rte", className].filter(Boolean).join(" ")} {...cslp}>
      {doc.children.map((n, i) => renderNode(n, n.uid ?? i))}
    </div>
  );
}

/** Plain text of a JSON RTE document (meta descriptions, excerpts). */
export function rteToText(doc?: RteDoc): string {
  const walk = (n: RteNode): string => n.text ?? (n.children ?? []).map(walk).join(" ");
  return doc ? walk(doc).replace(/\s+/g, " ").trim() : "";
}
