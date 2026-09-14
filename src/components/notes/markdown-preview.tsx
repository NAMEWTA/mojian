import { useEffect, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isAssetPath, resolveAssetUrl } from "@/lib/assets";
import { useI18n } from "@/i18n";

function AssetImage({ src, alt }: { src?: string; alt: string }) {
  const [url, setUrl] = useState(src ?? "");

  useEffect(() => {
    if (!src || !isAssetPath(src)) {
      setUrl(src ?? "");
      return;
    }
    let alive = true;
    void resolveAssetUrl(src).then((next) => {
      if (alive) setUrl(next);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  return <img src={url} alt={alt} crossOrigin="anonymous" />;
}

const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
  img: ({ src, alt }) => <AssetImage src={src} alt={alt ?? ""} />,
};

export function MarkdownPreview({ content }: { content: string }) {
  const { t } = useI18n();
  if (!content.trim()) {
    return <p className="font-serif text-lg text-muted-foreground">{t("doc.emptyPreview")}</p>;
  }

  return (
    <div className="md-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
