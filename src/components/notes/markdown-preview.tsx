import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} crossOrigin="anonymous" />
  ),
};

export function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="font-serif text-lg text-muted-foreground">没有可预览的内容。</p>
    );
  }

  return (
    <div className="md-preview">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
