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

function makeComponents(onTaskToggle?: (index: number) => void): Components {
  let task = 0;
  return {
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    ),
    img: ({ src, alt }) => <AssetImage src={src} alt={alt ?? ""} />,
    input: ({ type, checked, ...props }) => {
      if (type !== "checkbox") return <input type={type} checked={checked} {...props} />;
      const index = task++;
      return (
        <input
          type="checkbox"
          checked={Boolean(checked)}
          disabled={!onTaskToggle}
          onChange={(event) => {
            event.stopPropagation();
            onTaskToggle?.(index);
          }}
          onClick={(event) => event.stopPropagation()}
        />
      );
    },
  };
}

export function MarkdownPreview({
  content,
  compact = false,
  onTaskToggle,
}: {
  content: string;
  compact?: boolean;
  onTaskToggle?: (index: number) => void;
}) {
  const { t } = useI18n();
  if (!content.trim()) {
    if (compact) return null;
    return <p className="font-serif text-lg text-muted-foreground">{t("doc.emptyPreview")}</p>;
  }

  return (
    <div className="md-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={makeComponents(onTaskToggle)}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
