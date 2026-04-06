import type { LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { requireUser } from "~/lib/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  await requireUser(request, context);
  const isbn = new URL(request.url).searchParams.get("isbn");
  if (!isbn) return json({ error: "missing isbn" }, { status: 400 });

  try {
    const res = await fetch(`https://openlibrary.org/isbn/${isbn}.json`);
    if (!res.ok) return json({ error: "ISBN not found" }, { status: 404 });
    const data = (await res.json()) as {
      title?: string;
      authors?: Array<{ key: string }>;
      publish_date?: string;
      works?: Array<{ key: string }>;
    };

    let description = "";
    if (data.works?.[0]?.key) {
      try {
        const worksRes = await fetch(`https://openlibrary.org${data.works[0].key}.json`);
        if (worksRes.ok) {
          const worksData = (await worksRes.json()) as {
            description?: string | { value: string };
          };
          if (typeof worksData.description === "string") {
            description = worksData.description;
          } else if (worksData.description?.value) {
            description = worksData.description.value;
          }
        }
      } catch {
        // description is optional
      }
    }

    // Resolve author names
    const authors: string[] = [];
    for (const author of data.authors || []) {
      try {
        const authorRes = await fetch(`https://openlibrary.org${author.key}.json`);
        if (authorRes.ok) {
          const authorData = (await authorRes.json()) as { name?: string };
          if (authorData.name) authors.push(authorData.name);
        }
      } catch {
        // skip failed author lookups
      }
    }

    const yearMatch = data.publish_date?.match(/\d{4}/);

    return json({
      title: data.title || "",
      authors,
      year: yearMatch ? parseInt(yearMatch[0]) : null,
      description,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`,
      url: `https://openlibrary.org/isbn/${isbn}`,
    });
  } catch {
    return json({ error: "ISBN lookup failed" }, { status: 500 });
  }
}
