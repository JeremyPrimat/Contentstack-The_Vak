import type { CSSProperties, ReactNode } from "react";
import { LANG_LABEL, LANGS, localizeHref, type Lang } from "@/lib/i18n";
import { getSite } from "@/lib/site";
import type { Brand, Footer as FooterEntry, Header as HeaderEntry } from "@/lib/types";
import { Logo } from "./Logo";
import { SmartLink } from "./ui";

function SiteHeader({ header, lang, path, siteName, isGroup }: { header?: HeaderEntry; lang: Lang; path: string; siteName: string; isGroup: boolean }) {
  return (
    <header className="site-header">
      {header?.announcement ? (
        <div className="announcement" {...header.$?.announcement}>
          {header.announcement}
        </div>
      ) : null}
      <div className="container header-bar">
        <SmartLink href="/" lang={lang} className="logo">
          {isGroup ? <Logo title={siteName} /> : <Logo wordmark={false} title="" />}
          {isGroup ? null : siteName}
        </SmartLink>
        <nav className="mega" aria-label="Main" {...header?.$?.mega_menu}>
          {(header?.mega_menu ?? []).map((item, i) => (
            <details key={i} className="mega-item">
              <summary {...item.$?.label}>{item.label}</summary>
              <div className="mega-panel">
                {(item.columns ?? []).map((col, j) => (
                  <div key={j} className="mega-col">
                    {col.heading ? <p className="mega-heading" {...col.$?.heading}>{col.heading}</p> : null}
                    <ul>
                      {(col.links ?? []).map((l, k) => (
                        <li key={k}>
                          <SmartLink href={l.href} lang={lang}>{l.title}</SmartLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {item.link?.href ? (
                  <SmartLink href={item.link.href} lang={lang} className="mega-all">
                    {item.label} →
                  </SmartLink>
                ) : null}
              </div>
            </details>
          ))}
        </nav>
        <div className="header-utils">
          {(header?.utility_links ?? []).map((l, i) => (
            <SmartLink key={i} href={l.href} lang={lang} className="util-link">
              {l.title}
            </SmartLink>
          ))}
          <nav className="lang-switch" aria-label="Language">
            {LANGS.map((l) => (
              <a key={l} href={localizeHref(path, l)} aria-current={l === lang ? "true" : undefined} hrefLang={l}>
                {LANG_LABEL[l]}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ footer, lang }: { footer?: FooterEntry; lang: Lang }) {
  if (!footer) return null;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {(footer.columns ?? []).map((col, i) => (
          <div key={i}>
            <p className="footer-heading" {...col.$?.heading}>{col.heading}</p>
            <ul>
              {(col.links ?? []).map((l, k) => (
                <li key={k}>
                  <SmartLink href={l.href} lang={lang}>{l.title}</SmartLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {footer.newsletter_heading ? (
          <div className="newsletter">
            <p className="footer-heading" {...footer.$?.newsletter_heading}>{footer.newsletter_heading}</p>
            <p className="small" {...footer.$?.newsletter_text}>{footer.newsletter_text}</p>
          </div>
        ) : null}
      </div>
      <div className="container footer-bottom">
        <div className="socials">
          {(footer.social_links ?? []).map((s, i) => (
            <a key={i} href={s.url} rel="noopener noreferrer" target="_blank">
              {s.platform}
            </a>
          ))}
        </div>
        <p className="small" {...footer.$?.legal_text}>{footer.legal_text}</p>
      </div>
    </footer>
  );
}

/**
 * Header, footer and theme. The accent colour comes from content: the brand entry of
 * a brand stack, or the page's `theme_brand` on the group site.
 */
export function SiteShell({
  lang,
  path,
  header,
  footer,
  brand,
  children,
}: {
  lang: Lang;
  path: string;
  header?: HeaderEntry;
  footer?: FooterEntry;
  brand?: Brand;
  children: ReactNode;
}) {
  const site = getSite();
  const accent = brand?.accent_color ?? site.fallbackAccent;
  return (
    <div className={`site site-${site.id}`} style={{ "--accent": accent } as CSSProperties}>
      <SiteHeader header={header} lang={lang} path={path} siteName={brand?.title ?? site.name} isGroup={site.isGroup} />
      <main>{children}</main>
      <SiteFooter footer={footer} lang={lang} />
    </div>
  );
}
