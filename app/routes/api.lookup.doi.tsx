import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireUser(request, context);
  const doi = new URL(request.url).searchParams.get("doi");
  if (!doi) return json({ error: "missing doi" }, { status: 400 });

  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
    if (!res.ok) return json({ error: "DOI not found" }, { status: 404 });
    const data = (await res.json()) as {
      message: {
        title?: string[];
        author?: Array<{ given?: string; family?: string }>;
        "container-title"?: string[];
        published?: { "date-parts"?: number[][] };
        type?: string;
      };
    };
    const msg = data.message;

    return json({
      title: msg.title?.[0] || "",
      authors: (msg.author || []).map((a) => [a.given, a.family].filter(Boolean).join(" ")),
      journal: msg["container-title"]?.[0] || "",
      year: msg.published?.["date-parts"]?.[0]?.[0] || null,
      url: `https://doi.org/${doi}`,
      type: msg.type || "",
    });
  } catch {
    return json({ error: "DOI lookup failed" }, { status: 500 });
  }
}
