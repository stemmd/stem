import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireUser(request, context);
  const q = new URL(request.url).searchParams.get("q");
  if (!q) return json({ error: "missing q" }, { status: 400 });

  try {
    const res = await fetch(
      `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&max_results=5`
    );
    if (!res.ok) return json({ error: "arXiv API error" }, { status: 502 });
    const xml = await res.text();

    const entries: Array<{
      arxivId: string;
      title: string;
      authors: string[];
      summary: string;
      pdfUrl: string;
      publishedDate: string;
    }> = [];

    const entryBlocks = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
    for (const block of entryBlocks) {
      const idMatch = block.match(/<id>([\s\S]*?)<\/id>/);
      const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = block.match(/<summary>([\s\S]*?)<\/summary>/);
      const publishedMatch = block.match(/<published>([\s\S]*?)<\/published>/);
      const pdfMatch = block.match(/<link[^>]*title="pdf"[^>]*href="([^"]*)"[^>]*\/?>/) ||
                       block.match(/<link[^>]*href="([^"]*)"[^>]*title="pdf"[^>]*\/?>/);
      const authorMatches = block.match(/<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g) || [];
      const authors = authorMatches.map((a) => {
        const m = a.match(/<name>([\s\S]*?)<\/name>/);
        return m ? m[1].trim() : "";
      }).filter(Boolean);

      const rawId = idMatch ? idMatch[1].trim() : "";
      const arxivId = rawId.replace("http://arxiv.org/abs/", "").replace(/v\d+$/, "");

      entries.push({
        arxivId,
        title: titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ") : "",
        authors,
        summary: summaryMatch ? summaryMatch[1].trim().replace(/\s+/g, " ") : "",
        pdfUrl: pdfMatch ? pdfMatch[1].trim() : `https://arxiv.org/pdf/${arxivId}`,
        publishedDate: publishedMatch ? publishedMatch[1].trim() : "",
      });
    }

    return json(entries);
  } catch {
    return json({ error: "arXiv search failed" }, { status: 500 });
  }
}
