import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireUser(request, context);
  const q = new URL(request.url).searchParams.get("q");
  if (!q) return json({ error: "missing q" }, { status: 400 });

  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=5&format=json&origin=*`
    );
    if (!res.ok) return json({ error: "Wikipedia API error" }, { status: 502 });
    const data = (await res.json()) as {
      query: { search: Array<{ title: string; snippet: string }> };
    };

    return json(
      (data.query?.search || []).map((item) => ({
        title: item.title,
        snippet: item.snippet.replace(/<[^>]*>/g, ""),
        pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`,
      }))
    );
  } catch {
    return json({ error: "Wikipedia search failed" }, { status: 500 });
  }
}
