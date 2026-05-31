import { marked } from "marked";
import DOMPurify from "dompurify";

const purify = DOMPurify(window);

export function markdownToHtml(md: string): string {
  if (!md) return "";
  const rawHtml = marked.parse(md) as string;
  return purify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
}
