import { getDomain, extractYouTubeId } from "~/lib/utils";

export interface OGData {
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string;
  domain: string;
  source_type: "youtube" | "wikipedia" | "paper" | "article" | "other";
  embed_url: string | null;
}

export function detectSourceType(url: string): OGData["source_type"] {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/wikipedia\.org/.test(url)) return "wikipedia";
  if (/arxiv\.org/.test(url)) return "paper";
  return "article";
}


function extractMeta(html: string, property: string): string | null {
  const direct = html.match(
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")
  );
  const reversed = html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i")
  );
  return (direct || reversed)?.[1] ?? null;
}

function extractTitle(html: string): string | null {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1].trim() ?? null;
}

export async function fetchOG(url: string): Promise<OGData> {
  const domain = getDomain(url);
  const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  const fallback: OGData = {
    title: null, description: null, image: null,
    favicon, domain, source_type: detectSourceType(url), embed_url: null,
  };

  // YouTube: use oEmbed for reliable title + thumbnail, then embed
  if (detectSourceType(url) === "youtube") {
    const videoId = extractYouTubeId(url);
    try {
      const oembed = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (oembed.ok) {
        const data = await oembed.json<{ title: string; author_name: string; thumbnail_url: string }>();
        return {
          title: data.title,
          description: data.author_name ? `by ${data.author_name}` : null,
          image: data.thumbnail_url ?? null,
          favicon,
          domain,
          source_type: "youtube",
          embed_url: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
        };
      }
    } catch { /* fall through to generic fetch */ }
    return { ...fallback, source_type: "youtube", embed_url: videoId ? `https://www.youtube.com/embed/${videoId}` : null };
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Stem/1.0 (+https://stem.md)" },
      signal: AbortSignal.timeout(8000),
    });
    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (contentLength > 1_000_000) return fallback;
    const html = await res.text();
    if (html.length > 1_000_000) return fallback;
    return {
      title: extractMeta(html, "og:title") || extractTitle(html),
      description: extractMeta(html, "og:description") || extractMeta(html, "description"),
      image: extractMeta(html, "og:image"),
      favicon,
      domain,
      source_type: detectSourceType(url),
      embed_url: null,
    };
  } catch {
    return fallback;
  }
}
